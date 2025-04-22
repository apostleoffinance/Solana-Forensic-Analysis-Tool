import React from 'react'
import EntityLabels from '@/components/EntityLabels'
import { getMockEntityLabels } from '@/api/entityLabels'

export default function EntityLabelsPage() {
    const mockEntityLabelsData = getMockEntityLabels()
  return (
    <div>
        <EntityLabels entities={mockEntityLabelsData} />
    </div>
  )
}
