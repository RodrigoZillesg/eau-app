import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { showNotification } from '../../../lib/notifications'
import { useAuthStore } from '../../../stores/authStore'

interface CPDCategory {
  id: number
  name: string
  points_per_hour: number
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryFormData {
  name: string
  points_per_hour: number
  description: string
}

export function CPDCategoriesPage() {
  const [categories, setCategories] = useState<CPDCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CPDCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    points_per_hour: 1,
    description: ''
  })
  const { getEffectiveUserId } = useAuthStore()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      // Get Supabase auth token
      const authData = localStorage.getItem('sb-ypsvoxelitgceclohxfu-auth-token')
      const token = authData ? JSON.parse(authData).access_token : null

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/cpd/categories/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to load CPD categories',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category?: CPDCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        points_per_hour: category.points_per_hour,
        description: category.description || ''
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        points_per_hour: 1,
        description: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      points_per_hour: 1,
      description: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const authData = localStorage.getItem('sb-ypsvoxelitgceclohxfu-auth-token')
      const token = authData ? JSON.parse(authData).access_token : null
      const url = editingCategory
        ? `${import.meta.env.VITE_API_URL}/api/v1/cpd/categories/${editingCategory.id}`
        : `${import.meta.env.VITE_API_URL}/api/v1/cpd/categories`

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        showNotification({
          title: 'Success',
          message: data.message || `Category ${editingCategory ? 'updated' : 'created'} successfully`,
          type: 'success'
        })
        handleCloseModal()
        loadCategories()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error saving category:', error)
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to save category',
        type: 'error'
      })
    }
  }

  const handleToggleActive = async (category: CPDCategory) => {
    try {
      const authData = localStorage.getItem('sb-ypsvoxelitgceclohxfu-auth-token')
      const token = authData ? JSON.parse(authData).access_token : null

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/cpd/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !category.is_active
        })
      })

      const data = await response.json()

      if (data.success) {
        showNotification({
          title: 'Success',
          message: `Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`,
          type: 'success'
        })
        loadCategories()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error toggling category status:', error)
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to update category status',
        type: 'error'
      })
    }
  }

  const handleDelete = async (category: CPDCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const authData = localStorage.getItem('sb-ypsvoxelitgceclohxfu-auth-token')
      const token = authData ? JSON.parse(authData).access_token : null

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/cpd/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        showNotification({
          title: 'Success',
          message: data.message || 'Category deleted successfully',
          type: 'success'
        })
        loadCategories()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error deleting category:', error)
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to delete category',
        type: 'error'
      })
    }
  }

  const getPointsBadgeColor = (points: number) => {
    switch(points) {
      case 1: return 'bg-gray-100 text-gray-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading categories...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CPD Categories Management</h1>
            <p className="text-gray-600 mt-2">
              Manage CPD activity categories and their point values
            </p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points/Hour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPointsBadgeColor(category.points_per_hour)}`}>
                      {category.points_per_hour} {category.points_per_hour === 1 ? 'point' : 'points'}/hr
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(category)}
                        className="text-gray-600 hover:text-gray-900"
                        title={category.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {category.is_active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Advanced Professional Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points per Hour *
                </label>
                <select
                  value={formData.points_per_hour}
                  onChange={(e) => setFormData({ ...formData, points_per_hour: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(points => (
                    <option key={points} value={points}>
                      {points} {points === 1 ? 'point' : 'points'} per hour
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Higher points for more valuable professional development activities
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this category..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
