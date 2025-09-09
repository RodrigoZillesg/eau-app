import React, { useState, useEffect } from 'react'
import { Users, AlertTriangle, Check, X, SkipForward, Search, Filter, Loader2, UserCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { memberDuplicateService } from '../../services/memberDuplicateService'
import { MemberMergeModal } from '../../components/admin/MemberMergeModal'
import { showNotification } from '../../lib/notifications'
import { format } from 'date-fns'

interface PendingDuplicate {
  id: string
  member1_id: string
  member2_id: string
  member1_first_name: string
  member1_last_name: string
  member1_email: string
  member1_company: string
  member2_first_name: string
  member2_last_name: string
  member2_email: string
  member2_company: string
  similarity_score: number
  match_details: any
  status: string
  created_at: string
}

export function MemberDuplicatesPage() {
  const [duplicates, setDuplicates] = useState<PendingDuplicate[]>([])
  const [filteredDuplicates, setFilteredDuplicates] = useState<PendingDuplicate[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [scoreFilter, setScoreFilter] = useState(0)
  const [selectedDuplicate, setSelectedDuplicate] = useState<PendingDuplicate | null>(null)
  const [showMergeModal, setShowMergeModal] = useState(false)

  useEffect(() => {
    loadDuplicates()
  }, [])

  useEffect(() => {
    filterDuplicates()
  }, [duplicates, searchTerm, scoreFilter])

  const loadDuplicates = async () => {
    try {
      setLoading(true)
      const data = await memberDuplicateService.getPendingDuplicates()
      setDuplicates(data)
    } catch (error) {
      console.error('Error loading duplicates:', error)
      showNotification('error', 'Failed to load duplicates')
    } finally {
      setLoading(false)
    }
  }

  const filterDuplicates = () => {
    let filtered = [...duplicates]

    // Score filter
    if (scoreFilter > 0) {
      filtered = filtered.filter(d => d.similarity_score >= scoreFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.member1_first_name?.toLowerCase().includes(search) ||
        d.member1_last_name?.toLowerCase().includes(search) ||
        d.member1_email?.toLowerCase().includes(search) ||
        d.member2_first_name?.toLowerCase().includes(search) ||
        d.member2_last_name?.toLowerCase().includes(search) ||
        d.member2_email?.toLowerCase().includes(search)
      )
    }

    setFilteredDuplicates(filtered)
  }

  const handleScanForDuplicates = async () => {
    try {
      setScanning(true)
      showNotification('info', 'Scanning for duplicates...')
      
      const matches = await memberDuplicateService.findAllDuplicates(50)
      
      // Save all found duplicates to database
      for (const match of matches) {
        await memberDuplicateService.saveDuplicate(match)
      }

      showNotification('success', `Found ${matches.length} potential duplicates`)
      await loadDuplicates()
    } catch (error) {
      console.error('Error scanning for duplicates:', error)
      showNotification('error', 'Failed to scan for duplicates')
    } finally {
      setScanning(false)
    }
  }

  const handleQuickAction = async (duplicateId: string, action: 'not_duplicate' | 'skipped') => {
    try {
      await memberDuplicateService.reviewDuplicate(duplicateId, action)
      await loadDuplicates()
    } catch (error) {
      console.error(`Error marking as ${action}:`, error)
      showNotification('error', `Failed to mark as ${action.replace('_', ' ')}`)
    }
  }

  const openMergeModal = (duplicate: PendingDuplicate) => {
    setSelectedDuplicate(duplicate)
    setShowMergeModal(true)
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-red-100 text-red-800'
    if (score >= 70) return 'bg-orange-100 text-orange-800'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getMatchBadges = (matchDetails: any) => {
    const badges = []
    
    if (matchDetails.exact_name) {
      badges.push({ label: 'Exact Name', color: 'bg-green-100 text-green-800' })
    } else if (matchDetails.similar_name) {
      badges.push({ label: 'Similar Name', color: 'bg-blue-100 text-blue-800' })
    }
    
    if (matchDetails.same_company) {
      badges.push({ label: 'Same Company', color: 'bg-purple-100 text-purple-800' })
    }
    
    if (matchDetails.similar_email) {
      badges.push({ label: 'Similar Email', color: 'bg-indigo-100 text-indigo-800' })
    }
    
    if (matchDetails.same_phone) {
      badges.push({ label: 'Same Phone', color: 'bg-pink-100 text-pink-800' })
    }
    
    if (matchDetails.same_address) {
      badges.push({ label: 'Same Address', color: 'bg-cyan-100 text-cyan-800' })
    }

    return badges
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Member Duplicates Management</h1>
            <p className="text-gray-600 mt-1">Review and merge potential duplicate member records</p>
          </div>
          <Button
            onClick={handleScanForDuplicates}
            disabled={scanning}
            className="mt-4 md:mt-0"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scan for Duplicates
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Duplicates</p>
                <p className="text-2xl font-bold">{duplicates.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold text-red-600">
                  {duplicates.filter(d => d.similarity_score >= 90).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium Confidence</p>
                <p className="text-2xl font-bold text-orange-600">
                  {duplicates.filter(d => d.similarity_score >= 70 && d.similarity_score < 90).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Confidence</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {duplicates.filter(d => d.similarity_score >= 50 && d.similarity_score < 70).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">All Scores</option>
                <option value="50">Score ≥ 50</option>
                <option value="70">Score ≥ 70</option>
                <option value="90">Score ≥ 90</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Duplicates List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredDuplicates.length === 0 ? (
          <Card className="p-8 text-center">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Duplicates Found</h3>
            <p className="text-gray-600">
              {duplicates.length === 0 
                ? "No potential duplicates detected. Click 'Scan for Duplicates' to search."
                : "No duplicates match your current filters."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDuplicates.map((duplicate) => (
              <Card key={duplicate.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Members Comparison */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Member 1 */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {duplicate.member1_first_name} {duplicate.member1_last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{duplicate.member1_email}</p>
                        {duplicate.member1_company && (
                          <p className="text-sm text-gray-500 mt-1">{duplicate.member1_company}</p>
                        )}
                      </div>

                      {/* Member 2 */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {duplicate.member2_first_name} {duplicate.member2_last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{duplicate.member2_email}</p>
                        {duplicate.member2_company && (
                          <p className="text-sm text-gray-500 mt-1">{duplicate.member2_company}</p>
                        )}
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(duplicate.similarity_score)}`}>
                        Score: {duplicate.similarity_score}%
                      </span>
                      {getMatchBadges(duplicate.match_details).map((badge, idx) => (
                        <span key={idx} className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Detected on {format(new Date(duplicate.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    <Button
                      onClick={() => openMergeModal(duplicate)}
                      size="sm"
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Merge
                    </Button>
                    <Button
                      onClick={() => handleQuickAction(duplicate.id, 'not_duplicate')}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Not Duplicate
                    </Button>
                    <Button
                      onClick={() => handleQuickAction(duplicate.id, 'skipped')}
                      size="sm"
                      variant="ghost"
                      className="flex-1"
                    >
                      <SkipForward className="w-4 h-4 mr-1" />
                      Skip
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Merge Modal */}
      {showMergeModal && selectedDuplicate && (
        <MemberMergeModal
          isOpen={showMergeModal}
          onClose={() => {
            setShowMergeModal(false)
            setSelectedDuplicate(null)
          }}
          duplicate={selectedDuplicate}
          onMergeComplete={() => {
            setShowMergeModal(false)
            setSelectedDuplicate(null)
            loadDuplicates()
          }}
        />
      )}
    </div>
  )
}