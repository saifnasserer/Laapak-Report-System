<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - Laapak</title>
    
    <!-- Bootstrap RTL CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <style>
        :root {
            --primary-color: #0d6efd;
            --secondary-color: #6c757d;
            --success-color: #198754;
            --info-color: #0dcaf0;
            --warning-color: #ffc107;
            --danger-color: #dc3545;
            --light-color: #f8f9fa;
            --dark-color: #212529;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
        }
        
        .sidebar {
            background-color: #fff;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
            height: 100vh;
            position: fixed;
            top: 0;
            right: 0;
            width: 250px;
            z-index: 1000;
            transition: all 0.3s;
        }
        
        .sidebar-collapsed {
            right: -250px;
        }
        
        .content {
            margin-right: 250px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .content-expanded {
            margin-right: 0;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .sidebar-logo {
            height: 40px;
        }
        
        .sidebar-menu {
            padding: 0;
            list-style: none;
        }
        
        .sidebar-menu li {
            margin-bottom: 5px;
        }
        
        .sidebar-menu a {
            display: block;
            padding: 12px 20px;
            color: var(--dark-color);
            text-decoration: none;
            transition: all 0.3s;
            border-radius: 5px;
            margin: 0 10px;
        }
        
        .sidebar-menu a:hover {
            background-color: rgba(13, 110, 253, 0.1);
            color: var(--primary-color);
        }
        
        .sidebar-menu a.active {
            background-color: var(--primary-color);
            color: #fff;
        }
        
        .sidebar-menu i {
            margin-left: 10px;
            width: 20px;
            text-align: center;
        }
        
        .navbar {
            background-color: #fff;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        .navbar-brand {
            display: none;
        }
        
        .page-header {
            background-color: #fff;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        .page-title {
            margin-bottom: 0;
            font-weight: 600;
        }
        
        .user-dropdown img {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        @media (max-width: 992px) {
            .sidebar {
                right: -250px;
            }
            
            .sidebar.active {
                right: 0;
            }
            
            .content {
                margin-right: 0;
            }
            
            .navbar-brand {
                display: block;
            }
        }
    </style>
    
    @yield('styles')
</head>
<body>
    <!-- Sidebar -->
    <nav id="sidebar" class="sidebar">
        <div class="sidebar-header d-flex justify-content-between align-items-center">
            <img src="{{ asset('img/logo.png') }}" alt="Laapak Logo" class="sidebar-logo">
            <button type="button" id="sidebarCollapseBtn" class="btn btn-sm btn-outline-secondary d-lg-none">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <ul class="sidebar-menu mt-4">
            <li>
                <a href="{{ route('client.dashboard') }}" class="{{ request()->routeIs('client.dashboard') ? 'active' : '' }}">
                    <i class="fas fa-tachometer-alt"></i> لوحة التحكم
                </a>
            </li>
            <li>
                <a href="{{ route('client.devices.index') }}" class="{{ request()->routeIs('client.devices.*') ? 'active' : '' }}">
                    <i class="fas fa-laptop"></i> أجهزتي
                </a>
            </li>
            <li>
                <a href="{{ route('client.reports.index') }}" class="{{ request()->routeIs('client.reports.*') ? 'active' : '' }}">
                    <i class="fas fa-file-alt"></i> التقارير
                </a>
            </li>
            <li>
                <a href="{{ route('client.warranty.index') }}" class="{{ request()->routeIs('client.warranty.*') ? 'active' : '' }}">
                    <i class="fas fa-shield-alt"></i> الضمان
                </a>
            </li>
            <li>
                <a href="{{ route('client.maintenance.index') }}" class="{{ request()->routeIs('client.maintenance.*') ? 'active' : '' }}">
                    <i class="fas fa-tools"></i> الصيانة
                </a>
            </li>
            <li>
                <a href="{{ route('client.invoices.index') }}" class="{{ request()->routeIs('client.invoices.*') ? 'active' : '' }}">
                    <i class="fas fa-file-invoice-dollar"></i> الفواتير
                </a>
            </li>
            <li>
                <a href="{{ route('client.profile') }}" class="{{ request()->routeIs('client.profile') ? 'active' : '' }}">
                    <i class="fas fa-user"></i> الملف الشخصي
                </a>
            </li>
            <li>
                <a href="{{ route('client.logout') }}" onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                    <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                </a>
                <form id="logout-form" action="{{ route('client.logout') }}" method="POST" class="d-none">
                    @csrf
                </form>
            </li>
        </ul>
    </nav>
    
    <!-- Page Content -->
    <div id="content" class="content">
        <!-- Navbar -->
        <nav class="navbar navbar-expand-lg mb-4">
            <div class="container-fluid">
                <button type="button" id="sidebarCollapse" class="btn btn-primary">
                    <i class="fas fa-bars"></i>
                </button>
                
                <a class="navbar-brand ms-3" href="{{ route('client.dashboard') }}">
                    <img src="{{ asset('img/logo.png') }}" alt="Laapak Logo" height="30">
                </a>
                
                <div class="ms-auto d-flex align-items-center">
                    <div class="dropdown user-dropdown">
                        <a class="btn btn-light dropdown-toggle" href="#" role="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src="{{ asset('img/default-avatar.png') }}" alt="User Avatar" class="me-2">
                            {{ Auth::guard('client')->user()->name }}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                            <li><a class="dropdown-item" href="{{ route('client.profile') }}"><i class="fas fa-user me-2"></i> الملف الشخصي</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item" href="{{ route('client.logout') }}" onclick="event.preventDefault(); document.getElementById('logout-form-nav').submit();">
                                    <i class="fas fa-sign-out-alt me-2"></i> تسجيل الخروج
                                </a>
                                <form id="logout-form-nav" action="{{ route('client.logout') }}" method="POST" class="d-none">
                                    @csrf
                                </form>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Page Header -->
        <div class="page-header">
            <h4 class="page-title">@yield('page-title', 'لوحة التحكم')</h4>
        </div>
        
        <!-- Main Content -->
        <main>
            @yield('content')
        </main>
        
        <!-- Footer -->
        <footer class="mt-5 text-center text-muted">
            <p>&copy; {{ date('Y') }} Laapak. جميع الحقوق محفوظة.</p>
        </footer>
    </div>
    
    <!-- Bootstrap JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Sidebar toggle
            const sidebar = document.getElementById('sidebar');
            const content = document.getElementById('content');
            const sidebarCollapse = document.getElementById('sidebarCollapse');
            const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
            
            sidebarCollapse.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                content.classList.toggle('content-expanded');
            });
            
            sidebarCollapseBtn.addEventListener('click', function() {
                sidebar.classList.remove('active');
            });
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', function(event) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickInsideSidebarToggle = sidebarCollapse.contains(event.target);
                
                if (!isClickInsideSidebar && !isClickInsideSidebarToggle && window.innerWidth < 992 && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });
            
            // Tooltips initialization
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        });
    </script>
    
    @yield('scripts')
</body>
</html>
