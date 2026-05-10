import { useCallback, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';

const Home = () => {
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ suggestionsError, setSuggestionsError ] = useState('')
    const [ isLoadingSuggestions, setIsLoadingSuggestions ] = useState(false)
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ findTripError, setFindTripError ] = useState('')
    const [ isFindingTrip, setIsFindingTrip ] = useState(false)
    const suggestionCacheRef = useRef(new Map())
    const suggestionsCooldownUntilRef = useRef(0)

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        socket.emit("join", { userType: "user", userId: user._id })
    }, [ socket, user ])

    useEffect(() => {
        const handleRideConfirmed = (ride) => {
            setVehicleFound(false)
            setWaitingForDriver(true)
            setRide(ride)
        }

        const handleRideStarted = (ride) => {
            console.log("ride")
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride } }) // Updated navigate to include ride data
        }

        socket.on('ride-confirmed', handleRideConfirmed)
        socket.on('ride-started', handleRideStarted)

        return () => {
            socket.off('ride-confirmed', handleRideConfirmed)
            socket.off('ride-started', handleRideStarted)
        }
    }, [ socket, navigate ])


    const fetchSuggestions = useCallback(async (input, setSuggestions) => {
        const query = input.trim()
        setSuggestionsError('')

        if (query.length < 3) {
            setSuggestions([])
            setIsLoadingSuggestions(false)
            return
        }

        if (Date.now() < suggestionsCooldownUntilRef.current) {
            setSuggestions([])
            setSuggestionsError('Map suggestions are temporarily rate limited. Please wait a minute and try again.')
            setIsLoadingSuggestions(false)
            return
        }

        const cacheKey = query.toLowerCase()
        if (suggestionCacheRef.current.has(cacheKey)) {
            setSuggestions(suggestionCacheRef.current.get(cacheKey))
            setIsLoadingSuggestions(false)
            return
        }

        setIsLoadingSuggestions(true)

        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: query },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            suggestionCacheRef.current.set(cacheKey, response.data)
            setSuggestions(response.data)
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to load suggestions right now.'

            if (error.response?.status === 429) {
                suggestionsCooldownUntilRef.current = Date.now() + 60000
                setSuggestionsError('Map suggestions are temporarily rate limited. Please wait a minute and try again.')
            } else if (error.response?.status === 401) {
                setSuggestionsError('Please log in again to load location suggestions.')
            } else {
                console.error('suggestions error:', error.response?.data || error.message || error)
                setSuggestionsError(message)
            }

            setSuggestions([])
        } finally {
            setIsLoadingSuggestions(false)
        }
    }, [])

    useEffect(() => {
        if (!panelOpen || activeField !== 'pickup') return

        const timeoutId = setTimeout(() => {
            fetchSuggestions(pickup, setPickupSuggestions)
        }, 400)

        return () => clearTimeout(timeoutId)
    }, [ activeField, panelOpen, pickup, fetchSuggestions ])

    useEffect(() => {
        if (!panelOpen || activeField !== 'destination') return

        const timeoutId = setTimeout(() => {
            fetchSuggestions(destination, setDestinationSuggestions)
        }, 400)

        return () => clearTimeout(timeoutId)
    }, [ activeField, panelOpen, destination, fetchSuggestions ])

    const handlePickupChange = (e) => {
        setPickup(e.target.value)
    }

    const handleDestinationChange = (e) => {
        setDestination(e.target.value)
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
                // opacity:1
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
                // opacity:0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])


    async function findTrip() {
        setFindTripError('')

        if (pickup.trim().length < 3 || destination.trim().length < 3) {
            setFindTripError('Please enter pickup and destination addresses.')
            return
        }

        setIsFindingTrip(true)

        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
                params: { pickup, destination },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            setFare(response.data)
            setPanelOpen(false)
            setVehiclePanel(true)
        } catch (error) {
            const isRateLimited = error.response?.status === 429
            const errorMessage = error.response?.data?.message || 'Unable to calculate fare right now.'

            if (isRateLimited) {
                console.warn('findTrip rate limited:', errorMessage)
            } else {
                console.error('findTrip error:', error.response?.data || error.message || error)
            }

            setVehiclePanel(false)
            setFindTripError(errorMessage)
        } finally {
            setIsFindingTrip(false)
        }
    }

    async function createRide() {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
                pickup,
                destination,
                vehicleType
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            return response.data
        } catch (error) {
            console.error('createRide error:', error.response?.data || error.message || error)
            // TODO: show user-friendly error notification
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <img className='w-16 absolute left-5 top-5' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
            <div className='h-screen w-screen'>
                {/* image for temporary use  */}
                <LiveTracking />
            </div>
            <div className=' flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className='h-[30%] p-6 bg-white relative'>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-semibold'>Find a trip</h4>
                    <form className='relative py-3' onSubmit={(e) => {
                        submitHandler(e)
                    }}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
                        <input
                            onFocus={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                            type="text"
                            placeholder='Add a pick-up location'
                        />
                        <input
                            onFocus={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full  mt-3'
                            type="text"
                            placeholder='Enter your destination' />
                    </form>
                    <button
                        onClick={findTrip}
                        disabled={isFindingTrip}
                        className='bg-black text-white px-4 py-2 rounded-lg mt-3 w-full disabled:bg-gray-500 disabled:cursor-not-allowed'>
                        {isFindingTrip ? 'Finding trip...' : 'Find Trip'}
                    </button>
                    {findTripError && <p className='text-red-600 text-sm mt-2'>{findTripError}</p>}
                </div>
                <div ref={panelRef} className='bg-white h-0'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                        isLoading={isLoadingSuggestions}
                        error={suggestionsError}
                        query={activeField === 'pickup' ? pickup : destination}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}

                    setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full  z-10 bottom-0  bg-white px-3 py-6 pt-12'>
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>
        </div>
    )
}

export default Home
