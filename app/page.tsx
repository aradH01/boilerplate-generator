'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import "./globals.css";

export default function Home() {
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github');
  const [projectName, setProjectName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);


  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 300);
  };


  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/boilerplate-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, projectName, namespace, visibility }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert('❌ Error: ' + (data.message || res.status));
    } else {
      closeModal();
      setProjectName('');
      setNamespace('');
      window.open(data.webUrl, '_blank');
    }
  }

  return (

    <div className="">
    <div className="relative bg-black-6">
      <div className=" bg-[url('/assets/svg/Noise.svg')] bg-blend-darken bg-repeat bg-opacity-[5%]">
        <div className="sm:p-[48px] p-[24px]">
          <div className="bg-[url('/assets/svg/Noise.svg')] bg-opacity-[3%] relative bg-repeat rounded-[38px]">
            <div className="absolute w-[160px] h-[160px] left-[32px] top-[2px] bg-[#bcbdd9] rounded-full " />
            <div className="glass border-2 border-solid border-transparent pb-[80px] bg-blend-luminosity w-full rounded-[38px] shadow-lg">
              <div className="3xl:max-w-[1400px] 3xl:mx-auto px-[50px]">
                <header className="flex justify-between items-center py-[33.92px] px-12 gradient-border-4">

                    <Link href="/">
                      <Image
                        src="/assets/svg/Logo.png"
                        className="w-[140px] h-[24.16px]"
                        alt="Felixin logo"
                        width={140}
                        height={24.16}
                      />
                    </Link>
                    <div className="header-menu-bg rounded-xl gap-8 py-[13px] px-[20px] flex">
                      <div className="flex items-center gap-2.5">

                        <div className='flex items-center gap-[8px]'>
                        <Image
                          src="/assets/svg/box.svg"
                          className="w-[16px] h-[16px]"
                          alt=""
                          width={16}
                          height={16}
                        />
                        <h1 className="font-lecturis font-bold text-[15px] text-white-base leading-5">
                          Tools ⌁ boilerplate-nextjs
                        </h1>
                        </div>
                      </div>
                      <span className="font-lecturis font-bold text-[13px] text-gray-1 leading-5">
                        v1.beta
                      </span>
                    </div>

                  <div className="">

                    <div className="flex items-center justify-center rounded-xl w-[40px] h-[40px] bg-blue-2 rounded-full glass ">
                      <Image
                        src="/assets/svg/github.svg"
                        className="w-[12px] h-[13.33px]"
                        alt="github logo"
                        width={12}
                        height={13.33}
                      />
                    </div>
                  </div>
                </header>

                <div className="flex flex-col">
                  <div className="mdl:px-[92px] sm:px-[54px] px-4 flex mlap:flex-row flex-col justify-between items-center">
                    <div className="relative md:w-[545px] w-fit mt-[32px]">
                      <div className="max-w-[336px] gradient-border-5 ">
                        <div className="flex items-center justify-between px-4 mb-4 pt-6">
                          <span className="gradient-opacity font-dogica opacity-70 font-normal text-[12px] text-gray-1 leading-4">
                            Aug
                          </span>
                          <span className="font-dogica opacity-70 font-normal text-[12px] text-gray-1 leading-4">
                            Sep
                          </span>
                          <span className="gradient-opacity font-dogica opacity-70 font-normal text-[12px] text-gray-1 leading-4">
                            Oct
                          </span>
                        </div>
                        <Image
                          src="/assets/svg/dot-with-line.svg"
                          alt="dot images"
                          className="w-[336px] h-[280px]"
                          width={336}
                          height={280}
                        />
                      </div>
                      <div className='absolute top-[5rem] flex items-center px-[4px]'>
                        <div className=" w-max">
                          <div className="flex flex-col items-end">
                            <div className="flex gap-[19px] items-center">
                              <div className="border rounded-full border-[1.5px] border-gray-3 p-[2px]">
                                <div className="tick-box w-[28px] h-[28px] flex items-center justify-center rounded-full">
                                  <Image
                                    src="/assets/svg/tick.svg"
                                    alt="tick"
                                    className="w-[12px] h-[12px]"
                                    width={12}
                                    height={12}
                                  />
                                </div>
                              </div>
                              <span className="font-lecturis font-bold mdl:text-[40px] mlap:text-[32px] md:text-[40px] text-[18px] text-white-1 leading-[48px]">
                                Congratulations! You did it.{" "}
                              </span>
                            </div>
                            <p className="font-lecturis pt-[15px] w-fit font-light mdl:text-[20px] mlap:text-[16px] md:text-[20px] text-[10px] text-white-1 leading-[28px]">
                              You&apos;ve successfully created a project with
                              <span className="font-lecturis font-bold md:text-[20px] text-[12px] text-white-2 leading-[28px]">
                                {" "}
                                nestjs + npm.
                              </span>
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                    <div className="flex items-center mt-[32px] mlap:right-0">
                      <div className="doc-box max-w-[394px] py-8 rounded-[12px]">
                        <div className="">
                          <div className="px-[28px]">
                            <h2 className="text-[20px] mb-[17.8px] font-lecturis font-bold leading-[14px] text-white-base">
                              Documentation
                            </h2>
                                                            <p className="text-[16px] sm:max-w-[340px] w-[300px] font-lecturis font-normal leading-[26px] text-white-base">
  Kickstart your projects with a <span className="text-blue-3">custom boilerplate</span> powered by Next.js, Radix UI, and Tailwind CSS.
  Save time with pre-built, reusable components and automated GitHub/GitLab setup—so you can focus on building, not configuring.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  <div className="flex flex-col items-center mt-[4rem] sm:mt-[-5rem]">
                    <button
                      className='action-button cursor-pointer'
                      onClick={() => setIsModalOpen(true)}
                    >
                    <Image
                      src="/assets/svg/File.svg"
                      className="w-[364px] h-[334px]"
                      alt="File image"
                      width={364}
                      height={334}
                        />
                    </button>
                    <div className="-mt-[6.5rem] gap-[6px] flex flex-col items-center">
                      <h3 className="m-[0px] font-lecturis font-normal text-[20px] text-white-1 text-center">
                        Welcome to Your New{" "}
                        <span className="font-bold">NextJs</span> Boilerplate!
                      </h3>
                      <div className="flex flex-col items-center gap-[6px]">
                        <p className="m-[0px] font-lecturis font-normal text-[16px] text-center text-white-10">
                          Your Boilerplate template is up and running.
                        </p>
                        <p className="m-[0px] font-lecturis font-normal text-[16px] text-center text-white-10">
                          Please delete this sample file and create your own files
                          to get started.
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-black-5 backdrop-blur-12 flex items-center justify-center z-50 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={closeModal}
          role='dialog'
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className={`glass px-[12px] pb-[24px] border-2 border-solid border-transparent bg-background-1 rounded-[12px] p-6 max-w-lg w-full mx-4 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '32rem',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-[16px]"
            >
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-lecturis font-bold text-white-base">🚀 Create New Project</h1>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-1 action-button hover:text-white-base text-[24px] font-bold "
                >
                  ×
                </button>
              </div>

              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'github' | 'gitlab')}
                className="h-[48px] rounded-[12px] px-[12px] p-3 bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
              >
                <option className='text-black-base' value="github">GitHub</option>
                <option className='text-black-base' value="gitlab">GitLab</option>
              </select>

              <input
                type="text"
                placeholder="Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-[48px] rounded-[12px] px-[12px] bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis placeholder:text-gray-1 focus:outline-none focus:ring-2 focus:ring-blue-1"
                required
              />

              <input
                type="text"
                placeholder={provider === 'github' ? 'Org/User name' : 'Namespace ID'}
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="h-[48px] rounded-[12px] px-[12px] p-3 bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis placeholder:text-gray-1 focus:outline-none focus:ring-2 focus:ring-blue-1"
                required
              />

              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="h-[48px] rounded-[12px] px-[12px] p-3 bg-black-2 border border-gray-3 rounded-lg text-white-base font-lecturis focus:outline-none focus:ring-2 focus:ring-blue-1"
              >
                <option className='text-black-base' value="private">Private</option>
                <option className='text-black-base' value="public">Public</option>
                {provider === 'gitlab' && <option className='text-black-base' value="internal">Internal</option>}
              </select>

              <div className="h-[48px] flex gap-[16px] mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-[12px] flex-1 p-3 bg-black-2 border border-gray-3 text-gray-1 rounded-lg font-lecturis hover:bg-black-1 focus:outline-none focus:ring-2 focus:ring-gray-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-[12px] outline-none border-none flex-1 p-3 bg-blue-1 text-white-base rounded-lg font-lecturis disabled:opacity-50 disabled:cursor-not-allowed "
                >
                  {loading ? 'Creating…' : 'Create Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  </div>
  );
}
