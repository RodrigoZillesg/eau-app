import Swal from 'sweetalert2'

// SweetAlert2 configuration with Tailwind-compatible styles
const swalConfig = {
  customClass: {
    popup: 'rounded-lg shadow-xl',
    title: 'text-lg font-semibold text-gray-900',
    htmlContainer: 'text-sm text-gray-600',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors',
    cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors mr-2',
    denyButton: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors mr-2'
  },
  buttonsStyling: false
}

export const notifications = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'success',
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false
    })
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'error',
      title,
      text,
      confirmButtonText: 'OK'
    })
  },

  warning: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'OK'
    })
  },

  info: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'info',
      title,
      text,
      confirmButtonText: 'OK'
    })
  },

  confirm: (title: string, text?: string, confirmText = 'Yes', cancelText = 'Cancel') => {
    return Swal.fire({
      ...swalConfig,
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        ...swalConfig.customClass,
        actions: 'gap-3'
      }
    })
  },

  confirmDelete: (itemName: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: 'Are you sure?',
      text: `Do you want to delete ${itemName}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors ml-2',
        actions: 'gap-3'
      }
    })
  },

  loading: (title: string = 'Processing...') => {
    return Swal.fire({
      ...swalConfig,
      title,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
  },

  toast: {
    success: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-lg shadow-lg'
        }
      })
    },

    error: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-lg shadow-lg'
        }
      })
    },

    info: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-lg shadow-lg'
        }
      })
    }
  },

  copyToClipboard: (text: string, successMessage = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text).then(() => {
      notifications.toast.success(successMessage)
    }).catch(() => {
      notifications.toast.error('Failed to copy to clipboard')
    })
  }
}

// Export individual notification functions for easier importing
// Supports both formats:
// 1. showNotification('success', 'Title', 'Text')
// 2. showNotification({ type: 'success', title: 'Title', message: 'Text' })
export const showNotification = (
  typeOrOptions: 'success' | 'error' | 'warning' | 'info' | {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  },
  title?: string,
  text?: string
) => {
  // Handle object format
  if (typeof typeOrOptions === 'object') {
    const { type, title, message } = typeOrOptions
    return notifications[type](title, message)
  }

  // Handle separate parameters format
  return notifications[typeOrOptions](title!, text)
}