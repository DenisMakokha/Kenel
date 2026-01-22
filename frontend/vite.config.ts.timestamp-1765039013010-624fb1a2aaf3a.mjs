// vite.config.ts
import { defineConfig } from "file:///C:/Users/DenisMakokha/CascadeProjects/kenels-lms/frontend/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.25/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/DenisMakokha/CascadeProjects/kenels-lms/frontend/node_modules/.pnpm/@vitejs+plugin-react-swc@3._65ac34b3b844c9002772d9bb3fb5833d/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\DenisMakokha\\CascadeProjects\\kenels-lms\\frontend";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEZW5pc01ha29raGFcXFxcQ2FzY2FkZVByb2plY3RzXFxcXGtlbmVscy1sbXNcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERlbmlzTWFrb2toYVxcXFxDYXNjYWRlUHJvamVjdHNcXFxca2VuZWxzLWxtc1xcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvRGVuaXNNYWtva2hhL0Nhc2NhZGVQcm9qZWN0cy9rZW5lbHMtbG1zL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3YydcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVcsU0FBUyxvQkFBb0I7QUFDdFksT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
