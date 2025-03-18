// pages/AdminPage.jsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { UserPlus, Trash2, Search, Mail, RefreshCw, Shield, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import axios from "axios";

const AdminPage = () => {
  const { authUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    fullName: "",
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/users");
      const data = await res.data;
      
      if (res.status != 200) {
        throw new Error(data.error || "Failed to fetch users");
      }
      
      setUsers(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    
    try {
      const res = await axiosInstance.post("/admin/create-user",newUser);
      
      const data = await res.data;
      
      if (res.status != 200) {
        throw new Error(data.error || "Failed to create user");
      }
      
      setUsers([data.user, ...users]);
      setNewUser({ email: "", fullName: "" });
      toast.success("User created successfully! Email sent with credentials.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await axiosInstance.delete(`/admin/delete-user/${userId}`);
      
      const data = await res.data;
      
      if (res.status != 200) {
        throw new Error(data.error || "Failed to delete user");
      }
      
      setUsers(users.filter(user => user._id !== userId));
      toast.success("User deleted successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // New function to toggle admin status
  const handleToggleAdminStatus = async (userId, currentStatus) => {
    try {
      const res = await axiosInstance.patch(`/admin/toggle-admin/${userId}`,{ isAdmin: !currentStatus });
      
      const data = await res.data;
      
      if (res.status != 200) {
        throw new Error(data.error || "Failed to update admin status");
      }
      
      // Update the user in the list
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isAdmin: !currentStatus } : user
      ));
      
      toast.success(`User ${!currentStatus ? "promoted to admin" : "demoted from admin"} successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl min-h-[calc(100vh-8rem)]">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="size-6 text-primary" />
                <h1 className="text-2xl font-bold">Admin Panel</h1>
              </div>
              <button 
                className="btn btn-sm btn-outline gap-2"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create User Form */}
              <div className="bg-base-200 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <UserPlus className="size-5" />
                  Create New User
                </h2>
                <form onSubmit={handleCreateUser}>
                  <div className="form-control w-full mb-3">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input input-bordered w-full"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-control w-full mb-4">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="john.doe@example.com"
                      className="input input-bordered w-full"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser ? (
                      <>
                        <Loader className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-4" />
                        Create User
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="bg-base-200 rounded-lg p-4 lg:col-span-2">
                <h2 className="text-lg font-bold mb-4">Users List</h2>
                
                <div className="form-control mb-4">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="input input-bordered w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn btn-square">
                      <Search className="size-5" />
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader className="size-10 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-base-content/60">No users found</p>
                      </div>
                    ) : (
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user._id}>
                              <td>{user.fullName}</td>
                              <td className="flex items-center gap-1">
                                <Mail className="size-4 text-base-content/60" />
                                {user.email}
                              </td>
                              <td>
                                <span className={`badge ${user.isAdmin ? "badge-primary" : "badge-ghost"}`}>
                                  {user.isAdmin ? "Admin" : "Faculty"}
                                </span>
                              </td>
                              <td className="flex gap-2">
                                {/* Toggle Admin Status Button */}
                                {user._id !== authUser._id && (
                                  <button 
                                    className={`btn btn-sm ${user.isAdmin ? "btn-outline" : "btn-primary"}`}
                                    onClick={() => handleToggleAdminStatus(user._id, user.isAdmin)}
                                    title={user.isAdmin ? "Remove admin privileges" : "Make admin"}
                                  >
                                    <Shield className="size-4" />
                                  </button>
                                )}
                                
                                {/* Delete User Button - disabled for admins */}
                                <button 
                                  className="btn btn-sm btn-error btn-outline"
                                  onClick={() => handleDeleteUser(user._id)}
                                  disabled={user._id === authUser._id || user.isAdmin}
                                  title={
                                    user._id === authUser._id 
                                      ? "You cannot delete yourself" 
                                      : user.isAdmin 
                                        ? "Cannot delete other admins" 
                                        : "Delete user"
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;