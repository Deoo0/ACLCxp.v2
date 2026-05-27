export interface NavItem {
    label: string;
    path?: string;
    href?: string;
    children?: NavItem[];
}

export const PublicNavItems = [
    { label: "Socials", children: [
        {label: "Facebook", href: "https://www.facebook.com/ACLCTacCity"},
    ]},
        { label: "Contacts", children: [
        {label: "Email", href: "mailto:admissionoffice_aclctacloban@yahoo.com"},
        {label: "Phone", href: "tel:+639273483570"},
    ]},
    { label: "Houses", children: [
        {label: "House of Azul", href: "https://www.facebook.com/OfficialTacAZUL"},
        {label: "House of Cahel", href: "https://www.facebook.com/houseofcahel"},
        {label: "House of Giallio", href: "https://www.facebook.com/profile.php?id=61552100223520"},
        {label: "House of Roxxo", href: "https://www.facebook.com/profile.php?id=61551847335086"},
        {label: "House of Vierrdy", href: "https://www.facebook.com/profile.php?id=100086705807387"},
    ]},
    { label: "About", path: "/about"},
];

export const UserNavItems = [
    {label: "Dashboard", path: "/dashboard",},
    {label: "Merit", path: "/merit",},
    {label: "Stats", path: "/stats",},
    { label: "Houses", children: [
        {label: "House of Azul", href: "https://www.facebook.com/OfficialTacAZUL"},
        {label: "House of Cahel", href: "https://www.facebook.com/houseofcahel"},
        {label: "House of Giallio", href: "https://www.facebook.com/profile.php?id=61552100223520"},
        {label: "House of Roxxo", href: "https://www.facebook.com/profile.php?id=61551847335086"},
        {label: "House of Vierrdy", href: "https://www.facebook.com/profile.php?id=100086705807387"},
    ]},
];