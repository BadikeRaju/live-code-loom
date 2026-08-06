from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from api.views import auth_views, workspace_views, notification_views


def _dispatch_workspaces(request):
    """Route GET/POST to different views on /api/workspaces."""
    if request.method == "GET":
        return workspace_views.get_workspaces(request)
    elif request.method == "POST":
        return workspace_views.create_workspace(request)
    from django.http import JsonResponse
    return JsonResponse({"error": "Method not allowed"}, status=405)


def _dispatch_workspace_detail(request, workspace_id):
    """Route GET/DELETE to different views on /api/workspaces/<id>."""
    if request.method == "GET":
        return workspace_views.get_workspace(request, workspace_id)
    elif request.method == "DELETE":
        return workspace_views.delete_workspace(request, workspace_id)
    from django.http import JsonResponse
    return JsonResponse({"error": "Method not allowed"}, status=405)


urlpatterns = [
    # Auth
    path("register", auth_views.register),
    path("login", auth_views.login),
    path("me", auth_views.get_me),
    path("profile", auth_views.update_profile),
    path("account", auth_views.delete_account),

    # Workspaces (method-dispatched)
    path("workspaces", csrf_exempt(_dispatch_workspaces)),
    path("workspaces/<str:workspace_id>", csrf_exempt(_dispatch_workspace_detail)),
    path("workspaces/<str:workspace_id>/files", workspace_views.upload_files),
    path("workspaces/<str:workspace_id>/files/<path:filename>/initial", workspace_views.get_initial_file_content),
    path("workspaces/<str:workspace_id>/share", workspace_views.share_workspace),
    path("workspaces/<str:workspace_id>/commit", workspace_views.commit_and_push),

    # Notifications
    path("notifications", notification_views.get_notifications),
    path("notifications/<str:notif_id>/read", notification_views.mark_read),
]
