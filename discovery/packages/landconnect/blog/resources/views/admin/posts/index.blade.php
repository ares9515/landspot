@extends('blog::admin.layouts.app')

@section('content')
    <div class="page-header d-flex justify-content-between">
      <h1>Posts</h1>
      <a href="{{ route('posts.create', [], false) }}" class="btn btn-primary btn-sm align-self-center">
        <i class="fa fa-plus-square" aria-hidden="true"></i> Add
      </a>
    </div>

    @include ('blog::admin.posts._list')
@endsection
