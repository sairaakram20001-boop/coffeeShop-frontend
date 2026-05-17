type AlertProps = {
  message: string
  type?: 'success' | 'error' | 'info'
}

export default function Alert({ message, type = 'info' }: AlertProps) {
  const style =
    type === 'error'
      ? 'border-red-300 bg-red-50 text-red-900'
      : type === 'success'
        ? 'border-green-300 bg-green-50 text-green-900'
        : 'border-amber-300 bg-amber-50 text-amber-900'

  return <div className={`rounded-xl border px-4 py-3 text-sm ${style}`}>{message}</div>
}
