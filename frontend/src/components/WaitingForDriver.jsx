import { vehicleImages, vehicleLabels } from '../utils/vehicleImages'

const getCaptainName = (captain) => {
  const firstName = captain?.fullname?.firstname || ''
  const lastName = captain?.fullname?.lastname || ''
  return `${firstName} ${lastName}`.trim() || 'Captain'
}

const WaitingForDriver = (props) => {
  const vehicleType = props.ride?.captain?.vehicle?.vehicleType || props.ride?.vehicleType || 'car'

  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
        props.setWaitingForDriver(false)
      }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

      <h3 className='mb-4 text-2xl font-semibold'>Rider accepted your ride</h3>

      <div className='rounded-xl bg-green-50 p-4'>
        <div className='flex items-center justify-between gap-3'>
          <img className='h-16 w-24 object-contain' src={vehicleImages[vehicleType]} alt={vehicleLabels[vehicleType]} />
          <div className='text-right'>
            <h2 className='text-lg font-medium capitalize'>{getCaptainName(props.ride?.captain)}</h2>
            <h4 className='text-xl font-semibold -mt-1 -mb-1'>{props.ride?.captain?.vehicle?.plate}</h4>
            <p className='text-sm text-gray-600 capitalize'>{props.ride?.captain?.vehicle?.vehicleType || vehicleLabels[vehicleType]}</p>
          </div>
        </div>
        <div className='mt-4 flex items-center justify-between rounded-lg bg-white p-3'>
          <span className='text-sm font-medium text-gray-600'>Ride OTP</span>
          <span className='font-mono text-xl font-bold tracking-widest'>{props.ride?.otp}</span>
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
          <div className='flex items-center gap-5 p-3'>
            <i className="ri-currency-line"></i>
            <div>
              <h3 className='text-lg font-medium'>₹{props.ride?.fare} </h3>
              <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver
