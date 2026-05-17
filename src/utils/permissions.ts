export const permissionTranslations: Record<string, string> = {
  Ads_Create: "Elan yaratmaq",
  Ads_Edit_Own: "Öz elanlarını düzəltmək",
  Ads_Delete_Own: "Öz elanlarını silmək",
  Ads_View: "Elanlara baxmaq",
  Ads_Report: "Elanları şikayət etmək",
  Ads_Edit_Any: "Hər hansı elanı düzəltmək",
  Ads_Delete_Any: "Hər hansı elanı silmək",
  Ads_Approve: "Elanları təsdiqləmək",
  Ads_Highlight: "Elanları irəli çəkmək",
  Categories_Manage: "Kateqoriyaları idarə etmək",
  Cities_Manage: "Şəhərləri idarə etmək",
  Users_View: "İstifadəçilərə baxmaq",
  Users_Ban: "İstifadəçiləri bloklamaq",
  Users_Unban: "İstifadəçiləri blokdan çıxarmaq",
  Users_ManageRoles: "Rolların idarə edilməsi",
  Users_Delete: "İstifadəçiləri silmək",
  Users_Balance_Increase: "Balansı artırmaq",
  Comments_View: "Rəylərə baxmaq",
  Comments_Delete: "Rəyləri silmək",
  Reports_View: "Şikayətlərə baxmaq",
  Reports_Resolve: "Şikayətləri həll etmək",
  Banners_Manage: "Bannerləri idarə etmək",
  Roles_Create: "Rolları yaratmaq",
  Roles_Edit: "Rolları düzəltmək",
  Roles_Delete: "Rolları silmək",
  Permissions_Assign: "İcazələri təyin etmək",
  Stores_Manage: "Mağazaları idarə etmək",
};

export const getPermissionLabel = (permission: string): string => {
  return permissionTranslations[permission] || permission;
};
