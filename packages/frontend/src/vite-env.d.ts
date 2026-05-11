/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEACHER_PASSWORD?: string;
  readonly VITE_MONITOR_CELL_MIN_WIDTH?: string;
  readonly VITE_MONITOR_CELL_MIN_HEIGHT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
