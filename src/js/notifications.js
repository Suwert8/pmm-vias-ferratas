// Sistema de notificaciones modernas - v1.4.0

// ===== SISTEMA DE NOTIFICACIONES =====
function showNotification(message, type = 'info', title = null, duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('❌ Contenedor de notificaciones no encontrado');
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Iconos por tipo
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-header">
            <i class="notification-icon ${icons[type] || icons.info}"></i>
            <span>${title || getDefaultTitle(type)}</span>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
        <div class="notification-progress"></div>
    `;
    
    container.appendChild(notification);
    
    // Animación de entrada
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Auto-cierre con barra de progreso
    if (duration > 0) {
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.width = '100%';
        progressBar.style.transitionDuration = duration + 'ms';
        
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }
    
    return notification;
}

function getDefaultTitle(type) {
    const titles = {
        success: 'Éxito',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
    };
    return titles[type] || 'Notificación';
}

// ===== FUNCIONES ESPECÍFICAS =====
function showSuccess(message, title = null) {
    return showNotification(message, 'success', title);
}

function showError(message, title = null) {
    return showNotification(message, 'error', title, 7000); // Errores duran más
}

function showWarning(message, title = null) {
    return showNotification(message, 'warning', title);
}

function showInfo(message, title = null) {
    return showNotification(message, 'info', title);
}

// ===== CONFIRMACIÓN MODERNA =====
function showConfirmation(message, title = 'Confirmar acción', confirmText = 'Sí', cancelText = 'No') {
    return new Promise((resolve) => {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('❌ Contenedor de notificaciones no encontrado');
            resolve(false);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification warning';
        notification.style.maxWidth = '400px';
        
        notification.innerHTML = `
            <div class="notification-header">
                <i class="notification-icon fas fa-question-circle"></i>
                <span>${title}</span>
            </div>
            <div class="notification-message">${message}</div>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary btn-small confirm-cancel">${cancelText}</button>
                <button class="btn btn-accent btn-small confirm-ok">${confirmText}</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Event listeners
        const confirmBtn = notification.querySelector('.confirm-ok');
        const cancelBtn = notification.querySelector('.confirm-cancel');
        
        function cleanup() {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });
        
        // Auto-cancelar después de 15 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                cleanup();
                resolve(false);
            }
        }, 15000);
    });
}

console.log('📢 NOTIFICACIONES CARGADAS - v1.4.0');