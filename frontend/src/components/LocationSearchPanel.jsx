const LocationSearchPanel = ({ suggestions, setPanelOpen, setPickup, setDestination, activeField, isLoading, error, query }) => {

    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion)
        } else if (activeField === 'destination') {
            setDestination(suggestion)
        }
        setPanelOpen(false)
    }

    const shouldShowEmptyState = query.trim().length >= 3 && !isLoading && !error && suggestions.length === 0

    return (
        <div>
            {isLoading && <p className='text-sm text-gray-500 px-3 py-2'>Loading suggestions...</p>}
            {error && <p className='text-sm text-red-600 px-3 py-2'>{error}</p>}
            {shouldShowEmptyState && <p className='text-sm text-gray-500 px-3 py-2'>No suggestions found.</p>}
            {/* Display fetched suggestions */}
            {
                suggestions.map((elem, idx) => (
                    <div key={idx} onClick={() => handleSuggestionClick(elem)} className='flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start'>
                        <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                        <h4 className='font-medium'>{elem}</h4>
                    </div>
                ))
            }
        </div>
    )
}

export default LocationSearchPanel
