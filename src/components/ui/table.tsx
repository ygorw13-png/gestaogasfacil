import * as React from "react"

import { cn } from "@/lib/utils"

// No celular (<640px), uma tabela que não cabe na largura vira cartões:
// cada linha vira um bloco e cada célula mostra o título da coluna (data-label).
const CELULAR = "(max-width: 639px)"

function ajustarCartoes(wrap: HTMLDivElement, table: HTMLTableElement) {
  const celular = window.matchMedia(CELULAR).matches
  if (!celular || table.dataset.semCartoes !== undefined) {
    delete wrap.dataset.cartoes
    return
  }
  const titulos: string[] = []
  const cab = table.tHead?.rows[table.tHead.rows.length - 1]
  if (cab) {
    for (const th of Array.from(cab.cells)) {
      const t = (th.textContent || "").trim()
      for (let i = 0; i < (th.colSpan || 1); i++) titulos.push(t)
    }
  }
  for (const corpo of Array.from(table.tBodies)) {
    for (const tr of Array.from(corpo.rows)) {
      let col = 0
      for (const td of Array.from(tr.cells)) {
        const t = td.colSpan > 1 ? "" : titulos[col] || ""
        if (td.dataset.label !== t) td.dataset.label = t
        col += td.colSpan || 1
      }
    }
  }
  // mede a largura natural da tabela sem o modo cartão
  delete wrap.dataset.cartoes
  if (table.scrollWidth > wrap.clientWidth + 1) wrap.dataset.cartoes = "1"
}

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const tableRef = React.useRef<HTMLTableElement | null>(null)
  const setRefs = React.useCallback(
    (el: HTMLTableElement | null) => {
      tableRef.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTableElement | null>).current = el
    },
    [ref]
  )
  React.useLayoutEffect(() => {
    const wrap = wrapRef.current
    const table = tableRef.current
    if (!wrap || !table) return
    let quadro = 0
    const agendar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => ajustarCartoes(wrap, table))
    }
    ajustarCartoes(wrap, table)
    const mo = new MutationObserver(agendar)
    mo.observe(table, { childList: true, subtree: true, characterData: true })
    let ultimaLargura = wrap.clientWidth
    const ro = new ResizeObserver(() => {
      if (wrap.clientWidth !== ultimaLargura) {
        ultimaLargura = wrap.clientWidth
        agendar()
      }
    })
    ro.observe(wrap)
    return () => {
      cancelAnimationFrame(quadro)
      mo.disconnect()
      ro.disconnect()
    }
  }, [])
  return (
    <div ref={wrapRef} className="tabela-responsiva relative w-full overflow-auto">
      <table
        ref={setRefs}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
})
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
