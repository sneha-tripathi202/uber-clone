import { useEffect, useState } from 'react'
import { vehicleImages, vehicleLabels } from '../utils/vehicleImages'

const TIMER_SECONDS = 60

const LookingForDriver = (props) => {
    const vehicleType = props.vehicleType || 'car'
    const [ secondsLeft, setSecondsLeft ] = useState(TIMER_SECONDS)
    const [ hasTimedOut, setHasTimedOut ] = useState(false)

    useEffect(() => {
        if (!props.isOpen || hasTimedOut) return

        const timerId = setInterval(() => {
            setSecondsLeft((currentSeconds) => {
                if (currentSeconds <= 1) {
                    clearInterval(timerId)
                    setHasTimedOut(true)
                    return 0
                }

                return currentSeconds - 1
            })
        }, 1000)

        return () => clearInterval(timerId)
    }, [ hasTimedOut, props.isOpen ])

    const progress = ((TIMER_SECONDS - secondsLeft) / TIMER_SECONDS) * 100

    const tryAgain = () => {
        setSecondsLeft(TIMER_SECONDS)
        setHasTimedOut(false)
        props.createRide()
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setVehicleFound(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Looking for a Driver</h3>

            <div className='mb-5'>
                <div className='flex items-center justify-between text-sm font-medium'>
                    <span>{hasTimedOut ? 'No rider this time. Try again.' : 'Finding a rider...'}</span>
                    <span>{secondsLeft}s</span>
                </div>
                <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${hasTimedOut ? 'bg-red-500' : 'bg-green-600'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {hasTimedOut && (
                    <button
                        onClick={tryAgain}
                        className='mt-3 w-full rounded-lg bg-black p-2 text-sm font-semibold text-white'
                    >
                        Try Again
                    </button>
                )}
            </div>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <img className='h-24 w-36 object-contain' src={vehicleImages[vehicleType]} alt={vehicleLabels[vehicleType]} />
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{props.fare[vehicleType]} </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LookingForDriver
