import axios from "axios";

export default function handler(req, res) {
  res.status(200).json({ message: "Axios loaded!", axiosVersion: axios.VERSION || "unknown" });
}