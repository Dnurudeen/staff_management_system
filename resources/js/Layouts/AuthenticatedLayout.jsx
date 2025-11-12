import SidebarLayout from "@/Layouts/SidebarLayout";

export default function AuthenticatedLayout({ header, children, user }) {
    return <SidebarLayout header={header}>{children}</SidebarLayout>;
}
