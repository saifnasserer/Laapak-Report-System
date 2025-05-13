@extends('layouts.client')

@section('title', 'الملف الشخصي')

@section('page-title', 'الملف الشخصي')

@section('styles')
<style>
    .profile-card {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    .profile-header {
        background-color: #f8f9fa;
        padding: 30px;
        text-align: center;
    }
    .profile-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 20px;
        border: 5px solid #fff;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    .profile-tabs .nav-link {
        color: #6c757d;
        font-weight: 500;
        padding: 15px 20px;
        border-radius: 0;
        border: none;
        border-bottom: 3px solid transparent;
    }
    .profile-tabs .nav-link.active {
        color: #0d6efd;
        background-color: transparent;
        border-bottom: 3px solid #0d6efd;
    }
    .profile-tabs .nav-link:hover:not(.active) {
        border-bottom: 3px solid #dee2e6;
    }
    .profile-form label {
        font-weight: 500;
        margin-bottom: 5px;
    }
    .profile-info-item {
        margin-bottom: 20px;
    }
    .profile-info-label {
        font-weight: 500;
        color: #6c757d;
        margin-bottom: 5px;
    }
    .profile-info-value {
        font-weight: 400;
    }
    .avatar-upload {
        position: relative;
        max-width: 120px;
        margin: 0 auto 20px;
    }
    .avatar-edit {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 36px;
        height: 36px;
        background-color: #0d6efd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    .avatar-edit input {
        display: none;
    }
</style>
@endsection

@section('content')
<div class="row">
    <div class="col-lg-12">
        <div class="profile-card mb-4">
            <div class="profile-header">
                <div class="avatar-upload">
                    <img src="{{ $client->avatar ? asset('storage/avatars/' . $client->avatar) : asset('img/default-avatar.png') }}" alt="{{ $client->name }}" class="profile-avatar">
                    <label for="avatar-upload" class="avatar-edit" title="تغيير الصورة">
                        <i class="fas fa-camera"></i>
                        <input type="file" id="avatar-upload" name="avatar" form="update-avatar-form" accept="image/*" onchange="document.getElementById('update-avatar-form').submit()">
                    </label>
                </div>
                <form id="update-avatar-form" action="{{ route('client.profile.update-avatar') }}" method="POST" enctype="multipart/form-data" style="display: none;">
                    @csrf
                    @method('PUT')
                </form>
                <h4 class="mb-1">{{ $client->name }}</h4>
                <p class="text-muted mb-0">{{ $client->email }}</p>
                <p class="text-muted mb-0">عضو منذ {{ $client->created_at->format('Y-m-d') }}</p>
            </div>
            
            <div class="card-body p-0">
                <ul class="nav nav-tabs profile-tabs" id="profileTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab" aria-controls="info" aria-selected="true">
                            <i class="fas fa-user me-2"></i>المعلومات الشخصية
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="edit-tab" data-bs-toggle="tab" data-bs-target="#edit" type="button" role="tab" aria-controls="edit" aria-selected="false">
                            <i class="fas fa-edit me-2"></i>تعديل المعلومات
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="password-tab" data-bs-toggle="tab" data-bs-target="#password" type="button" role="tab" aria-controls="password" aria-selected="false">
                            <i class="fas fa-key me-2"></i>تغيير كلمة المرور
                        </button>
                    </li>
                </ul>
                
                <div class="tab-content p-4" id="profileTabsContent">
                    <!-- Personal Information Tab -->
                    <div class="tab-pane fade show active" id="info" role="tabpanel" aria-labelledby="info-tab">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="profile-info-item">
                                    <div class="profile-info-label">الاسم الكامل</div>
                                    <div class="profile-info-value">{{ $client->name }}</div>
                                </div>
                                <div class="profile-info-item">
                                    <div class="profile-info-label">البريد الإلكتروني</div>
                                    <div class="profile-info-value">{{ $client->email }}</div>
                                </div>
                                <div class="profile-info-item">
                                    <div class="profile-info-label">رقم الهاتف</div>
                                    <div class="profile-info-value">{{ $client->phone }}</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="profile-info-item">
                                    <div class="profile-info-label">العنوان</div>
                                    <div class="profile-info-value">{{ $client->address ?? 'غير محدد' }}</div>
                                </div>
                                <div class="profile-info-item">
                                    <div class="profile-info-label">المدينة</div>
                                    <div class="profile-info-value">{{ $client->city ?? 'غير محدد' }}</div>
                                </div>
                                <div class="profile-info-item">
                                    <div class="profile-info-label">آخر تسجيل دخول</div>
                                    <div class="profile-info-value">{{ $client->last_login_at ? $client->last_login_at->format('Y-m-d H:i') : 'غير محدد' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Edit Information Tab -->
                    <div class="tab-pane fade" id="edit" role="tabpanel" aria-labelledby="edit-tab">
                        <form action="{{ route('client.profile.update') }}" method="POST" class="profile-form">
                            @csrf
                            @method('PUT')
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="name">الاسم الكامل</label>
                                    <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name', $client->name) }}" required>
                                    @error('name')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="email">البريد الإلكتروني</label>
                                    <input type="email" class="form-control @error('email') is-invalid @enderror" id="email" name="email" value="{{ old('email', $client->email) }}" required>
                                    @error('email')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="phone">رقم الهاتف</label>
                                    <input type="text" class="form-control @error('phone') is-invalid @enderror" id="phone" name="phone" value="{{ old('phone', $client->phone) }}">
                                    @error('phone')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="address">العنوان</label>
                                    <input type="text" class="form-control @error('address') is-invalid @enderror" id="address" name="address" value="{{ old('address', $client->address) }}">
                                    @error('address')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="city">المدينة</label>
                                    <input type="text" class="form-control @error('city') is-invalid @enderror" id="city" name="city" value="{{ old('city', $client->city) }}">
                                    @error('city')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            
                            <div class="text-end">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i> حفظ التغييرات
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Change Password Tab -->
                    <div class="tab-pane fade" id="password" role="tabpanel" aria-labelledby="password-tab">
                        <form action="{{ route('client.profile.update-password') }}" method="POST" class="profile-form">
                            @csrf
                            @method('PUT')
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="current_password">كلمة المرور الحالية</label>
                                    <input type="password" class="form-control @error('current_password') is-invalid @enderror" id="current_password" name="current_password" required>
                                    @error('current_password')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="password">كلمة المرور الجديدة</label>
                                    <input type="password" class="form-control @error('password') is-invalid @enderror" id="password" name="password" required>
                                    @error('password')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="password_confirmation">تأكيد كلمة المرور الجديدة</label>
                                    <input type="password" class="form-control" id="password_confirmation" name="password_confirmation" required>
                                </div>
                            </div>
                            
                            <div class="text-end">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-key me-1"></i> تغيير كلمة المرور
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Activity Log -->
        <div class="profile-card">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-history text-primary me-2"></i> سجل النشاطات</h5>
            </div>
            <div class="card-body p-0">
                @if($activities && $activities->count() > 0)
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>النشاط</th>
                                    <th>التاريخ</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($activities as $activity)
                                <tr>
                                    <td>{{ $activity->description }}</td>
                                    <td>{{ $activity->created_at->format('Y-m-d H:i') }}</td>
                                    <td>
                                        @if($activity->status == 'success')
                                            <span class="badge bg-success">ناجح</span>
                                        @elseif($activity->status == 'warning')
                                            <span class="badge bg-warning text-dark">تحذير</span>
                                        @elseif($activity->status == 'danger')
                                            <span class="badge bg-danger">فشل</span>
                                        @else
                                            <span class="badge bg-info">معلومات</span>
                                        @endif
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @else
                    <div class="p-4 text-center">
                        <p class="text-muted mb-0">لا توجد نشاطات مسجلة</p>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    // Show selected tab based on URL hash
    document.addEventListener('DOMContentLoaded', function() {
        const hash = window.location.hash;
        if (hash) {
            const tabId = hash.replace('#', '');
            const tab = document.querySelector(`#profileTabs button[data-bs-target="#${tabId}"]`);
            if (tab) {
                const bsTab = new bootstrap.Tab(tab);
                bsTab.show();
            }
        }
        
        // Update URL hash when tab changes
        const tabEls = document.querySelectorAll('#profileTabs button[data-bs-toggle="tab"]');
        tabEls.forEach(tabEl => {
            tabEl.addEventListener('shown.bs.tab', function (event) {
                const target = event.target.getAttribute('data-bs-target').replace('#', '');
                window.location.hash = target;
            });
        });
    });
</script>
@endsection
