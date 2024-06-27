import prettier from "eslint-plugin-prettier";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended", "prettier"), {
    plugins: {
        prettier,
    },

    files: ["**/*.js"],

    ignores: [
        "node_modules/**",
    ],

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: babelParser,
        ecmaVersion: 2021,
        sourceType: "script",

        parserOptions: {
            requireConfigFile: false,
        },
    },

    rules: {
        "arrow-spacing": ["warn", {
            before: true,
            after: true,
        }],

        "brace-style": ["error", "1tbs", {
            allowSingleLine: true,
        }],

        "comma-dangle": ["error", "always-multiline"],
        "comma-spacing": "error",
        "comma-style": "error",
        curly: ["error", "multi-line", "consistent"],
        "dot-location": ["error", "property"],
        "handle-callback-err": "off",
        indent: "off",
        "keyword-spacing": "error",

        "max-nested-callbacks": ["error", {
            max: 4,
        }],

        "max-statements-per-line": ["error", {
            max: 2,
        }],

        "no-console": "off",
        "no-empty-function": "error",
        "no-floating-decimal": "error",
        "no-inline-comments": "error",
        "no-lonely-if": "error",
        "no-multi-spaces": "error",

        "no-multiple-empty-lines": ["error", {
            max: 2,
            maxEOF: 1,
            maxBOF: 0,
        }],

        "no-shadow": ["error", {
            allow: ["err", "resolve", "reject"],
        }],

        "no-trailing-spaces": ["error"],
        "no-var": "error",
        "object-curly-spacing": ["error", "always"],
        "prefer-const": "error",
        "prettier/prettier": [
            "error",
            {
                "endOfLine": "auto",
            }
        ],
        semi: ["error", "always"],
        "space-before-blocks": "error",
        "space-in-parens": "error",
        "space-infix-ops": "error",
        "space-unary-ops": "error",
        "spaced-comment": "error",
        "no-unused-vars": "warn",
        yoda: "error",
    },
}];