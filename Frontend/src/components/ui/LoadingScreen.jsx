import logoSynthos from '../../assets/logo_synthos.svg'

export default function LoadingScreen() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center Surface">
      {/* <span className="TextFucsia truncate group-data-[collapsible=icon]:hidden text-lg tracking-wider">
        <p className="Header3">Cargando…</p>
      </span> */}
      <img src={logoSynthos} alt="" aria-hidden="true" className="size-32 shrink-0" />
    </div>
  )
}