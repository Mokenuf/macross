export default defineAppConfig({
  ui: {
    colors: {
      primary: 'macross-primary',
      secondary: 'macross-secondary',
      neutral: 'macross-gray',
    },
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
      slots: {
        base: 'font-semibold',
      },
      variants: {
        size: {
          xl: {
            base: 'px-5.5 py-3.5 text-base gap-2',
          },
        },
      },
    },
  },
})
