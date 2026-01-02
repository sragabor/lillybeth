import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  ...nextConfig,
  {
    rules: {
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          vars: "all",
        },
      ],
    },
  },
];
