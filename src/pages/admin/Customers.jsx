import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { formatDate } from '@/utils/date'
import AdminLayout from '@/components/admin/AdminLayout'
import Loading from '@/components/common/Loading'
import toast from 'react-hot-toast'
import './Admin.css'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)

      // Get all non-admin users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get order counts for each customer
      const customersWithOrders = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, total_usd')
            .eq('user_id', profile.id)

          const orderCount = orders?.length || 0
          const totalSpent = orders?.reduce((sum, order) => sum + order.total_usd, 0) || 0

          return {
            ...profile,
            orderCount,
            totalSpent
          }
        })
      )

      setCustomers(customersWithOrders)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout>
        <Loading text="Loading customers..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-customers">
        {/* Header */}
        <div className="page-header-admin">
          <div>
            <h1>Customers</h1>
            <p>Manage customer accounts</p>
          </div>
        </div>

        {/* Search */}
        <div className="admin-filters">
          <div className="filter-input">
            <input
              type="text"
              className="admin-form-control"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Customers Table */}
        {filteredCustomers.length === 0 ? (
          <div className="admin-section">
            <div className="empty-state-small">
              <i className="bi bi-people"></i>
              <h3>No customers found</h3>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Nationality</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.full_name || 'N/A'}</strong>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.nationality || '-'}</td>
                      <td>
                        <span className="badge-count">{customer.orderCount}</span>
                      </td>
                      <td>
                        <strong>${customer.totalSpent.toFixed(2)}</strong>
                      </td>
                      <td>{formatDate(customer.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="admin-summary">
          <p>Showing {filteredCustomers.length} of {customers.length} customers</p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Customers