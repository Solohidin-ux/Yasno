import { useApp } from '../lib/useApp'
import { Button, Modal } from './ui'

export function LimitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useApp()
  return (
    <Modal open={open} title="На бесплатном плане три схемы" onClose={onClose}>
      <p>
        Удалите одну или включите Pro. Оплата появится позже: кнопка только записывает тариф в базу.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button to={user ? '/pricing' : '/register?next=/pricing'}>Смотреть Pro</Button>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  )
}
