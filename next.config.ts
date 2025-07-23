import type { NextConfig } from "next";
import path from "path";
import webpack from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "react/react"),
      "react-dom": path.resolve(__dirname, "react/react-dom"),
      shared: path.resolve(__dirname, "react/shared"),
      "react-reconciler": path.resolve(__dirname, "react/react-reconciler"),
      scheduler: path.resolve(__dirname, "react/scheduler"),
      "react-client": path.resolve(__dirname, "react/react-client"),
      "react-dom-bindings": path.resolve(__dirname, "react/react-dom-bindings"),
    };

    config.module.rules.push({
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          plugins: ["@babel/plugin-transform-flow-strip-types"],
        },
      },
    });

    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: true,
        __EXPERIMENTAL__: true,
        __EXTENSION__: true,
        __PROFILE__: false,
        __TEST__: true,
        __IS_CHROME__: true,
        __IS_FIREFOX__: false,
        __IS_EDGE__: false,
        __IS_NATIVE__: false,
        __IS_INTERNAL_VERSION__: false,
      })
    );

    return config;
  },
};

export default nextConfig;
