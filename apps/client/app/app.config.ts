export default defineAppConfig({
  ui: {
    colors: {
      primary: 'macross-primary',
      secondary: 'macross-secondary',
      neutral: 'macross-gray',
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
