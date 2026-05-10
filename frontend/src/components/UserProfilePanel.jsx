const getUserName = (user) => {
    const firstName = user?.fullname?.firstname || user?.fullName?.firstName || ''
    const lastName = user?.fullname?.lastname || user?.fullName?.lastName || ''
    const name = `${firstName} ${lastName}`.trim()

    return name || 'User'
}

const UserProfilePanel = ({ user, onClose }) => {
    return (
        <div className='fixed left-4 right-4 top-20 z-30 rounded-xl bg-white p-4 shadow-xl'>
            <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-semibold text-white'>
                        {getUserName(user).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className='text-lg font-semibold capitalize'>{getUserName(user)}</h3>
                        <p className='text-sm text-gray-600'>{user?.email || 'No email added'}</p>
                    </div>
                </div>
                <button onClick={onClose} className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-100'>
                    <i className='ri-close-line text-lg'></i>
                </button>
            </div>
            <div className='mt-4 grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-gray-100 p-3'>
                    <p className='text-xs text-gray-600'>Account</p>
                    <p className='text-sm font-semibold'>Rider</p>
                </div>
                <div className='rounded-lg bg-gray-100 p-3'>
                    <p className='text-xs text-gray-600'>Payment</p>
                    <p className='text-sm font-semibold'>Cash</p>
                </div>
            </div>
        </div>
    )
}

export default UserProfilePanel
