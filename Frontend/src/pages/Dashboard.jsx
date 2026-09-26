import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  SparklesIcon,
  ArrowUpTrayIcon as UploadIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { assets } from "../assets/assets";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import DashboardContent from "../components/dashboard/DashboardContent";
import AddNotebookModal from "../components/dashboard/AddNotebookModal";
import axios from "../services/apiClient";
import { goTo } from "../utils/navigation";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creatingNotebook, setCreatingNotebook] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  // Fetch notebooks function
  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/folder");
      console.log("Notebooks response:", response.data);
      setNotebooks(response.data.folders || []); // Add fallback empty array
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        platform: navigator.platform,
      });

      // Check if it's a "no folders found" error
      if (
        error.response?.status === 404 &&
        error.response?.data?.msg === "no folders found"
      ) {
        setNotebooks([]); // Set empty array instead of showing error
      } else {
        // Only show error toast for actual errors
        toast.error("Failed to load notebooks");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  useEffect(() => {
    const closeNewMenu = (event) => { if (event.key === "Escape") setNewMenuOpen(false); };
    window.addEventListener("keydown", closeNewMenu);
    return () => window.removeEventListener("keydown", closeNewMenu);
  }, []);

  const handleAddNotebook = async (name) => {
    try {
      setCreatingNotebook(true);
      const response = await axios.post("/folder", { name });

      if (response.data.folder) {
        setNotebooks((prev) => [...prev, response.data.folder]);
        toast.success("Notebook created successfully");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating notebook:", error);
      toast.error(error.response?.data?.msg || "Failed to create notebook");
    } finally {
      setCreatingNotebook(false);
    }
  };

  // Keep the card and its confirmation visible until deletion succeeds.
  const handleDeleteNotebook = async (notebookId) => {
    try {
      await axios.delete(`/folder/${notebookId}`);
      setNotebooks((previous) => previous.filter((notebook) => notebook._id !== notebookId));

      // Show success message
      toast.success("Notebook deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting notebook:", error);

      toast.error(error.response?.data?.message || "Failed to delete notebook");
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    goTo("/");
  };

  return (
    <div className="dashboard-shell dashboard-product-shell dashboard-home-shell">
      <header className="dashboard-topbar">
        <button type="button" className="dashboard-topbar-brand" onClick={() => navigate('/dashboard')} aria-label="Go to dashboard home">
          <span className="dashboard-brand-mark">
            <img src={assets.logo} alt="" />
          </span>
          <span>NOTSY</span>
        </button>
        <nav className="dashboard-topbar-nav" aria-label="Primary navigation">
          <button
            type="button"
            className="is-active"
            onClick={() =>
              document
                .getElementById("home-top")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Home
          </button>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("home-notebooks")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Notebooks
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/graph-view")}
          >
            Map
          </button>
        </nav>
        <div className="dashboard-topbar-actions">
          <div className="dashboard-new-wrap">
            <button
              type="button"
              className="dashboard-new-button"
              onClick={() => setNewMenuOpen((value) => !value)}
            >
              <PlusIcon /> New
            </button>
            {newMenuOpen && (
              <div className="dashboard-new-menu">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(true);
                    setNewMenuOpen(false);
                  }}
                >
                  <PlusIcon /> New notebook
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("home-notes")
                      ?.scrollIntoView({ behavior: "smooth" });
                    setNewMenuOpen(false);
                  }}
                >
                  <SparklesIcon /> New note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("home-notes")
                      ?.scrollIntoView({ behavior: "smooth" });
                    setNewMenuOpen(false);
                  }}
                >
                  <UploadIcon /> Add resource
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="dashboard-logout-button"
            onClick={handleLogout}
            aria-label="Log out of Notsy"
          >
            <ArrowRightOnRectangleIcon /> Logout
          </button>
        </div>
      </header>
      <main id="home-top" className="dashboard-home-content">
        <DashboardContent
          notebooks={notebooks}
          loading={loading}
          onDeleteNotebook={handleDeleteNotebook}
          onAddNotebook={() => setIsModalOpen(true)}
        />
      </main>

      {/* Add Notebook Modal */}
      <AddNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNotebook}
        loading={creatingNotebook}
      />
    </div>
  );
};

export default Dashboard;
