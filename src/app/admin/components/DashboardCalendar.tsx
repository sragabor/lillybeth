'use client'

import { TimelineView } from '../bookings/components'

export default function DashboardCalendar() {
  return (
    <div className="h-[500px]">
      <TimelineView readOnly />
    </div>
  )
}
