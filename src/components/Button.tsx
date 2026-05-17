type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const styles = {
  primary: 'bg-[var(--ink)] text-[var(--porcelain)] hover:bg-[#1c1208]',
  secondary: 'bg-[var(--rosewood)] text-[var(--porcelain)] hover:bg-[#56362d]',
  ghost: 'bg-white/70 text-[var(--ink)] hover:bg-white',
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-95 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
