'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  connectionCount: number
}

const MAX_CONNECTIONS_PER_PARTICLE = 3
const MAX_DIST = 120
const MAX_DIST_SQ = MAX_DIST * MAX_DIST
const MOUSE_DIST = 80
const MOUSE_DIST_SQ = MOUSE_DIST * MOUSE_DIST
const MAX_SPEED = 1.5

export function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const count = Math.floor(70 + Math.random() * 30) // 70-100
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
      connectionCount: 0,
    }))

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const draw = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      const mouse = mouseRef.current

      // Update positions
      for (const p of particles) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dSq = dx * dx + dy * dy
        if (dSq < MOUSE_DIST_SQ && dSq > 0) {
          const dist = Math.sqrt(dSq)
          const force = (MOUSE_DIST - dist) / MOUSE_DIST
          p.vx += (dx / dist) * force * 0.15
          p.vy += (dy / dist) * force * 0.15
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED
          p.vy = (p.vy / speed) * MAX_SPEED
        }

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) { p.x = 0; p.vx *= -1 }
        else if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1 }
        if (p.y < 0) { p.y = 0; p.vy *= -1 }
        else if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1 }

        p.connectionCount = 0
      }

      // Draw connections — capped per particle for performance
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].connectionCount >= MAX_CONNECTIONS_PER_PARTICLE) continue
        for (let j = i + 1; j < particles.length; j++) {
          if (particles[j].connectionCount >= MAX_CONNECTIONS_PER_PARTICLE) continue
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dSq = dx * dx + dy * dy
          if (dSq < MAX_DIST_SQ) {
            const dist = Math.sqrt(dSq)
            const alpha = (1 - dist / MAX_DIST) * 0.12
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(147,197,253,${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
            particles[i].connectionCount++
            particles[j].connectionCount++
          }
        }
      }

      // Draw dots
      ctx.fillStyle = 'rgba(147,197,253,0.45)'
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      ro.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
