#include "StaticBuffer.h"
#include <cstring>

unsigned char StaticBuffer::blocks[BUFFER_CAPACITY][BLOCK_SIZE];
struct BufferMetaInfo StaticBuffer::metainfo[BUFFER_CAPACITY];
unsigned char StaticBuffer::blockAllocMap[DISK_BLOCKS];

StaticBuffer::StaticBuffer() {
        //STAGE 7
        // copy blockAllocMap blocks from disk to buffer (using readblock() of disk)
        // blocks 0 to 3
        for (int i = 0;i < 4; i++) {
            unsigned char buffer[BLOCK_SIZE];
            Disk::readBlock(buffer, i);
            memcpy(blockAllocMap + i*BLOCK_SIZE, buffer, BLOCK_SIZE);
        }
        

        for (int i = 0; i < BUFFER_CAPACITY; i++) {
            metainfo[i].free = true;
            metainfo[i].dirty = false;
            metainfo[i].timeStamp = -1;
            metainfo[i].blockNum = -1;
        }
}
      
      // write back all modified blocks on system exit
StaticBuffer::~StaticBuffer() {
        // STAGE 7
        // copy blockAllocMap blocks from buffer to disk(using writeblock() of disk)
        for (int i = 0;i < 4; i++) {
            unsigned char buffer[BLOCK_SIZE];
            memcpy(buffer,blockAllocMap + i*BLOCK_SIZE, BLOCK_SIZE);
            Disk::writeBlock(buffer, i);
        }


        /*iterate through all the buffer blocks,
          write back blocks with metainfo as free=false,dirty=true
          using Disk::writeBlock()
          */
        for(int i = 0; i < BUFFER_CAPACITY; i++){
            if(!metainfo[i].free && metainfo[i].dirty){
                Disk::writeBlock(blocks[i], metainfo[i].blockNum);
            }
        
      }
}


int StaticBuffer::getFreeBuffer(int blockNum) {
  // Assigns a buffer to the block and returns the buffer number. If no free
  // buffer block is found, the least recently used (LRU) buffer block is
  // replaced.

  if (blockNum < 0 || blockNum >= DISK_BLOCKS) {
    return E_OUTOFBOUND;
  }
  int allocatedBuffer= 0;
  // iterate through all the blocks in the StaticBuffer
  // find the first free block in the buffer (check metainfo)
  // assign allocatedBuffer = index of the free block
  for(; allocatedBuffer < BUFFER_CAPACITY; allocatedBuffer++) {
    if(metainfo[allocatedBuffer].free) {
      break;
    }
  }
  
   if (allocatedBuffer == BUFFER_CAPACITY) {
		int lastTimestamp = -1, bufferNum = -1;
		for (int bufferIndex = 0; bufferIndex < BUFFER_CAPACITY; bufferIndex++) {
			if (metainfo[bufferIndex].timeStamp > lastTimestamp) {
				lastTimestamp = metainfo[bufferIndex].timeStamp;
				bufferNum = bufferIndex;
			}
		}

		allocatedBuffer = bufferNum;
		if (metainfo[allocatedBuffer].dirty == true) {
			Disk::writeBlock(StaticBuffer::blocks[allocatedBuffer], metainfo[allocatedBuffer].blockNum);
		}

		// return FAILURE;
	}

  metainfo[allocatedBuffer].free = false;
  metainfo[allocatedBuffer].blockNum = blockNum;
  metainfo[allocatedBuffer].dirty=false;
  metainfo[allocatedBuffer].timeStamp=0;

  return allocatedBuffer;
}

int StaticBuffer::getBufferNum(int blockNum){
       if(blockNum < 0 || blockNum > DISK_BLOCKS){
              return E_OUTOFBOUND ;
       }
     for(int i = 0 ; i<BUFFER_CAPACITY;i++){
             if(metainfo[i].blockNum == blockNum && !metainfo[i].free){
                  return i ;
             }
     }

     return E_BLOCKNOTINBUFFER ;
}


// STAGE 6
int StaticBuffer::setDirtyBit(int blockNum){
        // find the buffer index corresponding to the block using getBufferNum().
        int bufferNum = getBufferNum(blockNum);

        // if block is not present in the buffer (bufferNum = E_BLOCKNOTINBUFFER)
        //     return E_BLOCKNOTINBUFFER
        if(bufferNum == E_BLOCKNOTINBUFFER){
            return E_BLOCKNOTINBUFFER;
        }
    
        // if blockNum is out of bound (bufferNum = E_OUTOFBOUND)
        //     return E_OUTOFBOUND
        if(bufferNum == E_OUTOFBOUND){
            return E_OUTOFBOUND;
        } 
    
        // else
        //     (the bufferNum is valid)
        //     set the dirty bit of that buffer to true in metainfo
        metainfo[bufferNum].dirty = true;
    
        return SUCCESS;
    }

    int StaticBuffer::getStaticBlockType(int blockNum){
      // Check if blockNum is valid (non zero and less than number of disk blocks)
      // and return E_OUTOFBOUND if not valid.
      if(blockNum < 0 || blockNum >= DISK_BLOCKS){
          return E_OUTOFBOUND;
      }
  
      // Access the entry in block allocation map corresponding to the blockNum argument
      // and return the block type after type casting to integer.
      return (int)blockAllocMap[blockNum];
  }
