const getCaptainName = (captain) => {
    const firstName = captain?.fullname?.firstname || ''
    const lastName = captain?.fullname?.lastname || ''
    const name = `${firstName} ${lastName}`.trim()

    return name || 'Captain'
}

const CaptainProfilePanel = ({ captain, onClose }) => {
    return (
        <div className='fixed left-4 right-4 top-20 z-30 rounded-xl bg-white p-4 shadow-xl'>
            <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                    <img
                        className='h-12 w-12 rounded-full object-cover'
                        src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdlMd7stpWUCmjpfRjUsQ72xSWikidbgaI1w&s'
                        alt='Captain profile'
                    />
                    <div>
                        <h3 className='text-lg font-semibold capitalize'>{getCaptainName(captain)}</h3>
                        <p className='text-sm text-gray-600'>{captain?.email || 'No email added'}</p>
                    </div>
                </div>
                <button onClick={onClose} className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-100'>
                    <i className='ri-close-line text-lg'></i>
                </button>
            </div>
            <div className='mt-4 grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-gray-100 p-3'>
                    <p className='text-xs text-gray-600'>Vehicle</p>
                    <p className='text-sm font-semibold capitalize'>{captain?.vehicle?.vehicleType || 'Not added'}</p>
                </div>
                <div className='rounded-lg bg-gray-100 p-3'>
                    <p className='text-xs text-gray-600'>Plate</p>
                    <p className='text-sm font-semibold uppercase'>{captain?.vehicle?.plate || 'Not added'}</p>
                </div>
            </div>
        </div>
    )
}

export default CaptainProfilePanel
