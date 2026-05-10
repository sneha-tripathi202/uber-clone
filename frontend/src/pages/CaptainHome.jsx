import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import LiveTracking from '../components/LiveTracking'
import CaptainProfilePanel from '../components/CaptainProfilePanel'
import { vehicleImages, vehicleLabels } from '../utils/vehicleImages'

const getUserName = (user) => {
    const firstName = user?.fullname?.firstname || ''
    const lastName = user?.fullname?.lastname || ''
    return `${firstName} ${lastName}`.trim() || 'User'
}

const CaptainHome = () => {

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)
    const [ captainProfileOpen, setCaptainProfileOpen ] = useState(false)
    const [ incomingRides, setIncomingRides ] = useState([])

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ ride, setRide ] = useState(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (!captain?._id) return

        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        })
        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {

                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    })
                })
            }
        }

        const locationInterval = setInterval(updateLocation, 10000)
        updateLocation()

        return () => clearInterval(locationInterval)
    }, [ captain?._id, socket ])

    useEffect(() => {
        const handleNewRide = (data) => {
            setRide(data)
            setIncomingRides((rides) => {
                const existingRide = rides.some((rideItem) => rideItem._id === data._id)
                return existingRide ? rides : [ data, ...rides ]
            })
            setRidePopupPanel(true)
        }

        socket.on('new-ride', handleNewRide)
        return () => socket.off('new-ride', handleNewRide)
    }, [ socket ])

    async function confirmRide(selectedRide = ride) {
        if (!selectedRide?._id) return

        await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {

            rideId: selectedRide._id,
            captainId: captain._id,


        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        setRide(selectedRide)
        setIncomingRides((rides) => rides.filter((rideItem) => rideItem._id !== selectedRide._id))
        setRidePopupPanel(false)
        setConfirmRidePopupPanel(true)

    }


    useGSAP(function () {
        if (ridePopupPanel) {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ ridePopupPanel ])

    useGSAP(function () {
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePopupPanel ])

    return (
        <div className='h-screen'>
            <div className='fixed left-5 right-5 top-5 z-20 flex items-center justify-between'>
                <button
                    onClick={() => navigate(-1)}
                    className='flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md'
                >
                    <i className='ri-arrow-left-line text-xl'></i>
                </button>
                <h1 className='font-bold text-3xl'>RideNow</h1>
                <button
                    onClick={() => setCaptainProfileOpen(true)}
                    className='flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md'
                >
                    <i className='ri-user-3-line text-xl'></i>
                </button>
                <Link to='/captain/logout' className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>
            {captainProfileOpen && <CaptainProfilePanel captain={captain} onClose={() => setCaptainProfileOpen(false)} />}
            <div className='h-3/5'>
                <LiveTracking />
            </div>
            <div className='h-2/5 p-6'>
                <CaptainDetails />
                <div className='mt-5'>
                    <div className='mb-3 flex items-center justify-between'>
                        <h3 className='text-lg font-semibold'>Nearby Ride Requests</h3>
                        <span className='rounded-full bg-gray-100 px-3 py-1 text-sm font-medium'>{incomingRides.length}</span>
                    </div>
                    <div className='max-h-48 space-y-3 overflow-y-auto pr-1'>
                        {incomingRides.length === 0 && (
                            <p className='rounded-lg bg-gray-100 p-3 text-sm text-gray-600'>No surrounding rides right now.</p>
                        )}
                        {incomingRides.map((rideRequest) => {
                            const vehicleType = rideRequest.vehicleType || 'car'

                            return (
                                <div key={rideRequest._id} className='rounded-lg border border-gray-200 p-3'>
                                    <div className='flex items-center justify-between gap-3'>
                                        <div className='flex items-center gap-3'>
                                            <img className='h-10 w-14 object-contain' src={vehicleImages[vehicleType]} alt={vehicleLabels[vehicleType]} />
                                            <div>
                                                <h4 className='font-semibold capitalize'>{getUserName(rideRequest.user)}</h4>
                                                <p className='text-xs text-gray-600'>{vehicleLabels[vehicleType]}</p>
                                            </div>
                                        </div>
                                        <h4 className='text-lg font-semibold'>₹{rideRequest.fare}</h4>
                                    </div>
                                    <div className='mt-3 space-y-1 text-sm text-gray-700'>
                                        <p><span className='font-medium'>Pickup:</span> {rideRequest.pickup}</p>
                                        <p><span className='font-medium'>Drop:</span> {rideRequest.destination}</p>
                                    </div>
                                    <button
                                        onClick={() => confirmRide(rideRequest)}
                                        className='mt-3 w-full rounded-lg bg-green-600 p-2 text-sm font-semibold text-white'
                                    >
                                        Accept Ride
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={confirmRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>
        </div>
    )
}

export default CaptainHome
