import React, { useState } from 'react'
import {BiSearchAlt2} from 'react-icons/bi'
import {  useNavigate } from "react-router-dom";
const SearchForm = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`)
            setSearchTerm("")
        }
    };
  
    return (
     
        <form
            className="search-form"
            onSubmit={handleSubmit}
        >
            <input
                type="text"
                name="search"
                placeholder="Search stories..."
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                aria-label="Search stories"
            />

            <button 
                type="submit" 
                disabled={!searchTerm.trim()}
                aria-label="Submit search"
            >
                <BiSearchAlt2 />
            </button>
        </form>
    )
}

export default SearchForm