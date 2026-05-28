import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import {
  createProduct,
  fetchProductById,
  updateProduct,
} from "../api/productApi";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  brand: "",
  category: "",
  countInStock: "",
};

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        const product = await fetchProductById(id);
        setFormData({
          name: product.name,
          description: product.description,
          price: String(product.price),
          image: product.image || "",
          brand: product.brand || "",
          category: product.category,
          countInStock: String(product.countInStock),
        });
      } catch (requestError) {
        const message =
          requestError.response?.data?.message ||
          "Failed to load product for editing.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      image: formData.image,
      brand: formData.brand,
      category: formData.category,
      countInStock: Number(formData.countInStock),
    };

    try {
      if (isEditMode) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate("/products");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Failed to save product. Admin access required.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-400">Loading form...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <Link to="/products" className="text-indigo-400 text-sm hover:text-indigo-300">
          ← Back to products
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          {isEditMode ? "Edit Product" : "Add Product"}
        </h1>
        <p className="text-slate-400 mt-1 mb-6">
          {isEditMode ? "Update product details" : "Create a new product listing"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "category", label: "Category", type: "text", required: true },
            { name: "brand", label: "Brand", type: "text", required: false },
            { name: "price", label: "Price", type: "number", required: true, min: 0, step: "0.01" },
            { name: "countInStock", label: "Stock", type: "number", required: true, min: 0 },
            { name: "image", label: "Image URL", type: "url", required: false },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block mb-2 text-sm text-slate-300">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.required}
                min={field.min}
                step={field.step}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}

          <div>
            <label htmlFor="description" className="block mb-2 text-sm text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error ? <p className="text-red-400 text-sm">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors font-medium"
          >
            {submitting
              ? "Saving..."
              : isEditMode
                ? "Update Product"
                : "Create Product"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ProductFormPage;
