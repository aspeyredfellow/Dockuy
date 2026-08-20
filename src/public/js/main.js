document.addEventListener('DOMContentLoaded', () => {
    // Mobile sidebar toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleSidebar() {
        if (sidebar && overlay) {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }
    }

    menuBtn?.addEventListener('click', toggleSidebar);
    closeBtn?.addEventListener('click', toggleSidebar);
    overlay?.addEventListener('click', toggleSidebar);
});

// Custom SweetAlert-like Dialogs
function showConfirm({ title = 'Are you sure?', text = '', confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) {
    return new Promise((resolve) => {
        const isDanger = type === 'danger' || type === 'warning';
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in';

        const iconBg = isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600';
        const confirmBtnColor = isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

        const iconSvg = isDanger 
            ? `<svg width="28" height="28" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
               </svg>`
            : `<svg width="28" height="28" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>`;

        overlay.innerHTML = `
            <div class="bg-white rounded-2xl border border-blue-100 shadow-2xl max-w-sm w-full p-6 text-center transform transition-all animate-scale-up">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl ${iconBg} mb-4">
                    ${iconSvg}
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">${title}</h3>
                <p class="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">${text}</p>
                <div class="flex items-center space-x-2.5">
                    <button id="swal-cancel" class="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all duration-200">
                        ${cancelText}
                    </button>
                    <button id="swal-confirm" class="flex-1 py-2.5 px-4 ${confirmBtnColor} text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        function cleanup(result) {
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
                resolve(result);
            }, 150);
        }

        overlay.querySelector('#swal-confirm')?.addEventListener('click', () => cleanup(true));
        overlay.querySelector('#swal-cancel')?.addEventListener('click', () => cleanup(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });
    });
}

function showAlert({ title = 'Notification', text = '', type = 'info' }) {
    return new Promise((resolve) => {
        const isSuccess = type === 'success';
        const isError = type === 'error';
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in';

        let iconBg = 'bg-blue-50 text-blue-600';
        let iconSvg = `<svg width="28" height="28" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

        if (isSuccess) {
            iconBg = 'bg-green-50 text-green-600';
            iconSvg = `<svg width="28" height="28" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        } else if (isError) {
            iconBg = 'bg-red-50 text-red-600';
            iconSvg = `<svg width="28" height="28" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        }

        overlay.innerHTML = `
            <div class="bg-white rounded-2xl border border-blue-100 shadow-2xl max-w-sm w-full p-6 text-center transform transition-all animate-scale-up">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl ${iconBg} mb-4">
                    ${iconSvg}
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">${title}</h3>
                <p class="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">${text}</p>
                <button id="swal-ok" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200">
                    OK
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        function cleanup() {
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
                resolve();
            }, 150);
        }

        overlay.querySelector('#swal-ok')?.addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
    });
}

function showToast({ message = '', type = 'success' }) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-xs w-full pointer-events-none p-4';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const bgClass = isSuccess ? 'bg-white border-blue-200 text-blue-900' : 'bg-red-50 border-red-200 text-red-800';

    toast.className = `${bgClass} border shadow-lg rounded-xl p-3.5 flex items-center space-x-2.5 pointer-events-auto transition-all duration-300 transform translate-y-4 opacity-0`;
    toast.innerHTML = `
        <span class="${isSuccess ? 'text-blue-600' : 'text-red-500'}">
            ${isSuccess 
                ? '<svg width="18" height="18" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
                : '<svg width="18" height="18" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
            }
        </span>
        <span class="text-xs sm:text-sm font-medium flex-1">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
