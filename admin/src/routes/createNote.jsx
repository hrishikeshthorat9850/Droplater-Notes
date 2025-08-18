import { useState } from 'react';
export default function CreateNote(){
      const [res,setRes] = useState({});
  const [formData,setFormData] = useState({
    title : "",
    body : "",
    releaseAt : "",
    webhookUrl :""
  });
  // const backendUrl = import.meta.env.VITE_API_URL;

  const handleInputChange = (e)=>{
    let {name,value} = e.target;
    setFormData((prev)=>({...prev,[name]:value}))
  }
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const serverResponse = await response.json();
      setRes(serverResponse);
      console.log("Server response:", serverResponse);
    } catch (err) {
      console.error("Error:", err);
    }
  };

    return(
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          DropLater Notes
        </h1>
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          <div>
            <label
              htmlFor="title"
              className="block text-gray-700 font-medium mb-1"
            >
              Title:
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note title"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label
              htmlFor="body"
              className="block text-gray-700 font-medium mb-1"
            >
              Body:
            </label>
            <input
              type="text"
              id="body"
              name="body"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note body"
              value={formData.body}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label
              htmlFor="webhookURL"
              className="block text-gray-700 font-medium mb-1"
            >
              Webhook URL:
            </label>
            <input
              type="text"
              id="webhookUrl"
              name="webhookUrl"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.webhookUrl}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label
              htmlFor="releaseAt"
              className="block text-gray-700 font-medium mb-1"
            >
              Webhook URL:
            </label>
            <input
              type="datetime-local"
              id="releaseAt"
              name="releaseAt"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.releaseAt}
              onChange={handleInputChange}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Note
          </button>
        </form>
        {
          res ? <h1>{res.message}</h1> : <p>{res.message}</p>
        }
      </div>
    </div>
    )
}