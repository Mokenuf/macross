const inputSurface = 'bg-macross-gray-950'
const controlSize = 'px-3 py-2.5 text-sm gap-2'

const control = {
  variants: {
    variant: { outline: inputSurface },
    size: { md: { base: controlSize } },
  },
}

const selectControl = {
  slots: { content: 'bg-elevated' },
  variants: {
    variant: { outline: inputSurface },
    size: { md: { base: controlSize, trailingIcon: 'size-3.5', itemTrailingIcon: 'size-4' } },
  },
}

export default defineAppConfig({
  ui: {
    badge: {
      slots: {
        base: 'font-semibold',
      },
      variants: {
        size: {
          md: {
            base: 'rounded-sm px-2.5',
          },
        },
      },
      defaultVariants: {
        variant: 'subtle',
      },
    },
    button: {
      slots: { base: 'font-semibold disabled:opacity-40' },
      variants: {
        size: {
          md: { base: 'px-4.5 py-2.5 gap-2' },
        },
      },
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'text-macross-primary-300 hover:bg-macross-primary-500/5 hover:ring-macross-primary-800',
        },
      ],
    },
    colors: {
      primary: 'macross-primary',
      neutral: 'macross-gray',
      success: 'macross-success',
      warning: 'macross-warning',
      error: 'macross-danger',
    },
    dropdownMenu: {
      slots: {
        content: 'bg-elevated',
        group: 'p-1.5',
        item: 'before:rounded-sm',
      },
      variants: {
        size: {
          md: {
            item: 'px-2.5',
            itemLeadingIcon: 'size-4',
          },
        },
        active: {
          false: {
            item: 'data-highlighted:before:bg-macross-primary-400/8 data-[state=open]:before:bg-macross-primary-400/8',
          },
        },
      },
    },
    formField: {
      slots: {
        label: 'font-semibold text-macross-primary-300',
      },
    },
    input: {
      variants: {
        variant: { outline: inputSurface },
        size: { md: { base: controlSize, leadingIcon: 'size-4' } },
      },
    },
    inputMenu: selectControl,
    inputNumber: control,
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
    select: selectControl,
    selectMenu: selectControl,
    table: {
      slots: {
        th: 'px-3 pt-0 pb-2.5 text-[10.5px] font-semibold uppercase tracking-widest text-dimmed border-b border-muted',
        td: 'p-3 text-sm text-default',
        tbody: 'divide-muted',
        tr: 'hover:bg-elevated/40 transition-colors',
      },
    },
    textarea: control,
  },
})
