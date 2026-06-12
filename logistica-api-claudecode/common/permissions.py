from rest_framework.permissions import DjangoModelPermissions
from apps.authentication.permissions import IsSuperUser


class StrictDjangoModelPermissions(DjangoModelPermissions):
    """
    Extiende DjangoModelPermissions para requerir también el permiso `view`
    en GET/HEAD. Los superusuarios bypasean esta verificación automáticamente.
    """
    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': ['%(app_label)s.view_%(model_name)s'],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }


__all__ = ['IsSuperUser', 'StrictDjangoModelPermissions']
