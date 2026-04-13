import React, {useState,useEffect} from 'react'
import { dummyPublishedImages } from '../assets/assets'
function Community() {
  const [images, setImages] = useState([])
  const [loading,setLoading] = useState(true)

  const fetchImages = async()=>{
    setImages(dummyPublishedImages)
    setLoading(false)
  }
  // console.log(assetsdummyPublishedImages)

  useEffect(()=>{
    fetchImages()
  },[])

  return (
    <div className='p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>
      <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-purple-100'>Community Showcase</h2>
      {images?.length > 0 ? (
        <div className='flex flex-wrap max-sm:justify-center gap-5'>
          {images.map((image,index)=>(
            <a key={index} href={image.imageUrl} target='_blank' className='relative group block rounded-lg overflow-hidden border border-gray-200 dark: border-purple-700 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <img src={image.imageUrl} className='w-full h-40 md:h-50 2xl:h-62 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out'/>
              <p className='absolute bottom-0 right-0 text-xs bg-black/50 text-white p-2 rounded-tl-lg'>Created by: {image.userName}</p>
            </a>
          ))}
        </div>
      ) : (
        <p className='text-center text-gray-500 dark:text-gray-400'>No images found</p>
      )}
    </div>
  )
}

export default Community