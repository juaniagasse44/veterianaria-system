import { useCallback, useEffect, useState } from 'react'
import type { Screen } from '../types'
import { listAppointments } from '../api/appointments'
import { listUpcomingVaccinations } from '../api/vaccinations'
import { listLowStock } from '../api/stock'
import { formatApiDate, formatApiTime, todayApiDate, vaccDaysLeftFrom } from '../utils/helpers'

const VACCINE_ALERT_DAYS = 7
const POLL_INTERVAL_MS = 5 * 60 * 1000

export interface NotificationItem {
  id: string
  icon: 'calendar' | 'syringe' | 'package'
  title: string
  subtitle: string
  screen: Screen
  urgent: boolean
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [appts, vaccines, lowStock] = await Promise.all([
        listAppointments({ date: todayApiDate() }),
        listUpcomingVaccinations({ days: VACCINE_ALERT_DAYS }),
        listLowStock(),
      ])

      const apptItems: NotificationItem[] = appts
        .filter(a => a.status === 'PENDIENTE' || a.status === 'CONFIRMADO')
        .map(a => ({
          id: `turno-${a.id}`,
          icon: 'calendar',
          title: `Turno hoy: ${a.pet.name}`,
          subtitle: `${formatApiTime(a.startAt)} · Dr./Dra. ${a.veterinarian.fullName}`,
          screen: 'turnos',
          urgent: false,
        }))

      const vaccineItems: NotificationItem[] = vaccines.map(v => {
        const daysLeft = v.nextDoseDate ? vaccDaysLeftFrom(v.nextDoseDate) : null
        return {
          id: `vacuna-${v.id}`,
          icon: 'syringe',
          title: `Vacuna próxima: ${v.pet.name}`,
          subtitle:
            daysLeft !== null && v.nextDoseDate
              ? daysLeft <= 0
                ? `${v.vaccineName} vence hoy`
                : `${v.vaccineName} vence el ${formatApiDate(v.nextDoseDate)}`
              : v.vaccineName,
          screen: 'vacunas',
          urgent: daysLeft !== null && daysLeft <= 0,
        }
      })

      const stockItems: NotificationItem[] = lowStock.map(s => ({
        id: `stock-${s.id}`,
        icon: 'package',
        title: `Stock bajo: ${s.product.name}`,
        subtitle: `${s.quantity} unidades (mínimo ${s.minQuantity})`,
        screen: 'stock',
        urgent: s.quantity <= 0,
      }))

      const all = [...apptItems, ...vaccineItems, ...stockItems]
      all.sort((a, b) => Number(b.urgent) - Number(a.urgent))
      setItems(all)
    } catch {
      // Las notificaciones son informativas: un fallo de red no debe romper el resto de la UI.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  return { items, loading, refresh: load }
}
