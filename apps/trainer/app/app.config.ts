export default defineAppConfig({
  ui: {
    colors: {
      primary: 'macross-primary',
      neutral: 'macross-gray',
      success: 'macross-success',
      warning: 'macross-warning',
      error: 'macross-danger',
    },
    navigationMenu: {
      compoundVariants: [
        {
          variant: 'pill',
          active: true,
          highlight: false,
          class: { link: 'before:bg-macross-primary-400/12' },
        },
        {
          color: 'primary',
          variant: 'pill',
          active: true,
          class: {
            link: 'text-macross-bronze-soft',
            linkLeadingIcon: 'text-macross-bronze-soft',
          },
        },
      ],
    },
    table: {
      slots: {
        th: 'px-3 pt-0 pb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-dimmed border-b border-muted',
        td: 'p-3 text-[13.5px] text-default',
        tbody: 'divide-muted',
        tr: 'hover:bg-elevated/40 transition-colors',
      },
    },
    badge: {
      slots: {
        base: 'font-semibold',
      },
      variants: {
        size: {
          md: {
            base: 'rounded-md px-2.5',
          },
        },
      },
      defaultVariants: {
        variant: 'subtle',
      },
    },
  },
})
