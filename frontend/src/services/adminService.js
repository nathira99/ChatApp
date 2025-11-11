import api from "./api";

export const adminService = {
  async getGroups() {
    const res = await api.get("/admin/groups");
    return res.data;
  },
  async deleteGroup(id) {
    const res = await api.delete(`/admin/groups/${id}`);
    return res.data;
  },
};
