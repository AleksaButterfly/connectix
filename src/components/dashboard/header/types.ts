export interface BreadcrumbItem {
  label: string;
  labelId?: string; // For i18n translation keys
  href?: string;
  icon?: React.ReactNode;
}