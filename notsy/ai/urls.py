from django.urls import path
from .views import *

urlpatterns = [
    path('', helloWorldView.as_view(), name='hello'),
    path('respond/', augmentedRespond.as_view(), name='respond'),
    path('upload/', miniRag.as_view(), name='miniRag'),
    path('querry/', query.as_view(), name='querry'),
    path('moded_query/', modedQuery.as_view(), name='moded_query'),
]