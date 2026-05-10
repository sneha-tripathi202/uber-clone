import { vehicleImages, vehicleLabels } from '../utils/vehicleImages'

const getUserName = (user) => {
    const firstName = user?.fullname?.firstname || ''
    const lastName = user?.fullname?.lastname || ''
    return `${firstName} ${lastName}`.trim() || 'User'
}

const RidePopUp = (props) => {
    const vehicleType = props.ride?.vehicleType || 'car'

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>New Ride Available</h3>
            <div className='flex items-center justify-between p-3 bg-yellow-400 rounded-lg mt-4'>
                <div className='flex items-center gap-3'>
                    <img className='h-12 rounded-full object-cover w-12' src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="User profile" />
                    <div>
                        <h2 className='text-lg font-medium capitalize'>{getUserName(props.ride?.user)}</h2>
                        <p className='text-xs text-gray-700'>{props.ride?.user?.email || 'Ride request'}</p>
                    </div>
                </div>
                <div className='text-right'>
                    <h5 className='text-lg font-semibold'>₹{props.ride?.fare}</h5>
                    <p className='text-xs capitalize'>{vehicleType}</p>
                </div>
            </div>
            <div className='mt-4 flex items-center gap-3 rounded-lg border p-3'>
                <img className='h-14 w-20 object-contain' src={vehicleImages[vehicleType]} alt={vehicleLabels[vehicleType]} />
                <div>
                    <h4 className='font-semibold'>{vehicleLabels[vehicleType]}</h4>
                    <p className='text-sm text-gray-600'>Nearby ride request</p>
                </div>
            </div>
            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Pickup</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Destination</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
                        </div>
                    </div>
                </div>
                <div className='mt-5 w-full'>
                    <button onClick={() => props.confirmRide(props.ride)} className='bg-green-600 w-full text-white font-semibold p-2 px-10 rounded-lg'>Accept Ride</button>

                    <button onClick={() => {
                        props.setRidePopupPanel(false)

                    }} className='mt-2 w-full bg-gray-300 text-gray-700 font-semibold p-2 px-10 rounded-lg'>Ignore</button>
                </div>
            </div>
        </div>
    )
}

export default RidePopUp
