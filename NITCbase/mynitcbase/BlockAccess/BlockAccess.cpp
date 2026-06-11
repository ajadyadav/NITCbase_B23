#include "BlockAccess.h"
#include<iostream>
#include <cstring>


inline bool operator == (RecId lhs, RecId rhs) {
	return (lhs.block == rhs.block && lhs.slot == rhs.slot);
}

inline bool operator != (RecId lhs, RecId rhs) {
	return (lhs.block != rhs.block || lhs.slot != rhs.slot);
}


RecId BlockAccess::linearSearch(int relId , char attrName[ATTR_SIZE],union Attribute attrVal , int op){

     RecId prevRecId ;
     RelCacheTable::getSearchIndex(relId, &prevRecId);
    
    int block = -1 ;
    int slot  = -1 ;

    if(prevRecId.block == -1 && prevRecId.slot ==-1){
           RelCatEntry RelCatBuf;
           RelCacheTable::getRelCatEntry(relId, &RelCatBuf);
           block = RelCatBuf.firstBlk ;
           slot = 0 ;
    }
    else{
          block = prevRecId.block;
          slot = prevRecId.slot + 1;
    }

     RelCatEntry relCatBuffer;
	 RelCacheTable::getRelCatEntry(relId, &relCatBuffer);

    while(block !=-1){
       
        RecBuffer Buffer(block);
        HeadInfo header;
        Attribute CatRecord[RELCAT_NO_ATTRS];
        Buffer.getRecord(CatRecord , slot);
        Buffer.getHeader(&header);

        unsigned char* slotMap = (unsigned char *)malloc(sizeof(unsigned char)*header.numSlots);
        Buffer.getSlotMap(slotMap);

        if(slot >= relCatBuffer.numSlotsPerBlk){
              block = header.rblock ;
              slot = 0 ;
              continue;
        }

       if (slotMap[slot] == SLOT_UNOCCUPIED) {
             slot++;
            continue;
      // increment slot and continue to the next record slot
    }

       AttrCatEntry attrCatBuf;
       AttrCacheTable::getAttrCatEntry(relId, attrName, &attrCatBuf);
      

      Attribute *record =(Attribute *)malloc(sizeof(Attribute) * header.numAttrs);
    Buffer.getRecord(record, slot);
    int attrOffset=attrCatBuf.offset;

    int cmpVal = compareAttrs(record[attrOffset], attrVal,attrCatBuf.attrType);
    if ((op == NE && cmpVal != 0) || // if op is "not equal to"
        (op == LT && cmpVal < 0) ||  // if op is "less than"
        (op == LE && cmpVal <= 0) || // if op is "less than or equal to"
        (op == EQ && cmpVal == 0) || // if op is "equal to"
        (op == GT && cmpVal > 0) ||  // if op is "greater than"
        (op == GE && cmpVal >= 0)    // if op is "greater than or equal to"
    ) {
     
      RecId newIndex;
      newIndex.block = block;
      newIndex.slot = slot;
      RelCacheTable::setSearchIndex(relId, &newIndex);
      return RecId{block, slot};
    }
    slot++;
    }

    return RecId{-1 ,-1};
}

//STAGE 6
int BlockAccess::renameRelation(char oldName[ATTR_SIZE], char newName[ATTR_SIZE]){
      /* reset the searchIndex of the relation catalog using
         RelCacheTable::resetSearchIndex() */
      RelCacheTable::resetSearchIndex(RELCAT_RELID);
  
      Attribute newRelationName;    // set newRelationName with newName
      strcpy(newRelationName.sVal, newName);
  
      // search the relation catalog for an entry with "RelName" = newRelationName
      RecId newRelationRecId = linearSearch(RELCAT_RELID, RELCAT_ATTR_RELNAME, newRelationName, EQ);
      if(newRelationRecId.block != -1 && newRelationRecId.slot != -1){
          return E_RELEXIST;
      }
  
      /* reset the searchIndex of the relation catalog using
         RelCacheTable::resetSearchIndex() */
      RelCacheTable::resetSearchIndex(RELCAT_RELID);
  
      Attribute oldRelationName;    // set oldRelationName with oldName
      strcpy(oldRelationName.sVal, oldName);
  
      // search the relation catalog for an entry with "RelName" = oldRelationName
      RecId oldRelationRecId = linearSearch(RELCAT_RELID, RELCAT_ATTR_RELNAME, oldRelationName, EQ);
      if(oldRelationRecId.block == -1 && oldRelationRecId.slot == -1){
          return E_RELNOTEXIST;
      }
  
      /* get the relation catalog record of the relation to rename using a RecBuffer
         on the relation catalog [RELCAT_BLOCK] and RecBuffer.getRecord function
      */
      RecBuffer relCatBuffer(oldRelationRecId.block);
      Attribute record[RELCAT_NO_ATTRS];
      relCatBuffer.getRecord(record, oldRelationRecId.slot);

      /* update the relation name attribute in the record with newName.
         (use RELCAT_REL_NAME_INDEX) */
      // set back the record value using RecBuffer.setRecord
      strcpy(record[RELCAT_REL_NAME_INDEX].sVal, newName);
      relCatBuffer.setRecord(record, oldRelationRecId.slot);
      /*
      update all the attribute catalog entries in the attribute catalog corresponding
      to the relation with relation name oldName to the relation name newName
      */
  
      /* reset the searchIndex of the attribute catalog using
         RelCacheTable::resetSearchIndex() */
      RelCacheTable::resetSearchIndex(ATTRCAT_RELID);
  
      // iterate over all the attribute catalog entries corresponding to the relation
      for(int i = 0; i < record[RELCAT_NO_ATTRIBUTES_INDEX].nVal; i++){
          RecId oldAttrRecId = linearSearch(ATTRCAT_RELID, ATTRCAT_ATTR_RELNAME, oldRelationName, EQ);
          if(oldAttrRecId.block == -1 && oldAttrRecId.slot == -1){
              return E_ATTRNOTEXIST;
          }
          RecBuffer attrCatBuffer(oldAttrRecId.block);
          Attribute attrRecord[ATTRCAT_NO_ATTRS];
          attrCatBuffer.getRecord(attrRecord, oldAttrRecId.slot);
          strcpy(attrRecord[ATTRCAT_REL_NAME_INDEX].sVal, newName);
          attrCatBuffer.setRecord(attrRecord, oldAttrRecId.slot);
      }
  
      return SUCCESS;
}

  //STAGE 6
int BlockAccess::renameAttribute(char relName[ATTR_SIZE], char oldName[ATTR_SIZE], char newName[ATTR_SIZE]) {

      /* reset the searchIndex of the relation catalog using
         RelCacheTable::resetSearchIndex() */
      RelCacheTable::resetSearchIndex(RELCAT_RELID);
  
      Attribute relNameAttr;    // set relNameAttr to relName
      strcpy(relNameAttr.sVal, relName);
  
      // Search for the relation with name relName in relation catalog using linearSearch()
      // If relation with name relName does not exist (search returns {-1,-1})
      //    return E_RELNOTEXIST;
      RecId relRecId = linearSearch(RELCAT_RELID, RELCAT_ATTR_RELNAME, relNameAttr, EQ);
      if(relRecId.block == -1 && relRecId.slot == -1){
          return E_RELNOTEXIST;
      }
  
      /* reset the searchIndex of the attribute catalog using
         RelCacheTable::resetSearchIndex() */
      RelCacheTable::resetSearchIndex(ATTRCAT_RELID);
  
      /* declare variable attrToRenameRecId used to store the attr-cat recId
      of the attribute to rename */
      RecId attrToRenameRecId{-1, -1};
      Attribute attrCatEntryRecord[ATTRCAT_NO_ATTRS];
  
      /* iterate over all Attribute Catalog Entry record corresponding to the
         relation to find the required attribute */
      while (true) {
          // linear search on the attribute catalog for RelName = relNameAttr
          RecId attrCatRecId = linearSearch(ATTRCAT_RELID, ATTRCAT_ATTR_RELNAME, relNameAttr, EQ);
          if(attrCatRecId.block == -1 && attrCatRecId.slot == -1){
            break;
          }
          /* Get the record from the attribute catalog using RecBuffer.getRecord
            into attrCatEntryRecord */
          RecBuffer attrCatBuffer(attrCatRecId.block);
          attrCatBuffer.getRecord(attrCatEntryRecord, attrCatRecId.slot);
          // if attrCatEntryRecord.attrName = oldName
          //     attrToRenameRecId = block and slot of this record
          if(strcmp(attrCatEntryRecord[ATTRCAT_ATTR_NAME_INDEX].sVal, oldName) == 0){
              attrToRenameRecId = attrCatRecId;
              break;
          }
  
          // if attrCatEntryRecord.attrName = newName
          //     return E_ATTREXIST;
          if(strcmp(attrCatEntryRecord[ATTRCAT_ATTR_NAME_INDEX].sVal, newName) == 0){
              return E_ATTREXIST;
          }
      }
  
      // if attrToRenameRecId == {-1, -1}
      //     return E_ATTRNOTEXIST;
      if(attrToRenameRecId.block == -1 && attrToRenameRecId.slot == -1){
          return E_ATTRNOTEXIST;
      }
  
      // Update the entry corresponding to the attribute in the Attribute Catalog Relation.
      /*   declare a RecBuffer for attrToRenameRecId.block and get the record at
           attrToRenameRecId.slot */
      //   update the AttrName of the record with newName
      //   set back the record with RecBuffer.setRecord
      RecBuffer attrCatBuffer(attrToRenameRecId.block);
      Attribute attrCatRecord[ATTRCAT_NO_ATTRS];
      attrCatBuffer.getRecord(attrCatRecord, attrToRenameRecId.slot);
      strcpy(attrCatRecord[ATTRCAT_ATTR_NAME_INDEX].sVal, newName);
      attrCatBuffer.setRecord(attrCatRecord, attrToRenameRecId.slot);
  
      return SUCCESS;
}

//Stage 10
int BlockAccess::search(int relId, Attribute *record, char attrName[ATTR_SIZE], Attribute attrVal, int op) {
    // Declare a variable called recid to store the searched record
    RecId recId;

    /* get the attribute catalog entry from the attribute cache corresponding
    to the relation with Id=relid and with attribute_name=attrName  */
    AttrCatEntry attrCatEntry;
    int ret = AttrCacheTable::getAttrCatEntry(relId, attrName, &attrCatEntry);
    if (ret != SUCCESS) {
        return E_ATTRNOTEXIST;
    }

    // if this call returns an error, return the appropriate error code

    // get rootBlock from the attribute catalog entry
    

    if (attrCatEntry.rootBlock == -1) {

        /* search for the record id (recid) corresponding to the attribute with
           attribute name attrName, with value attrval and satisfying the
           condition op using linearSearch()
        */
        recId = linearSearch(relId, attrName, attrVal, op);
    } else {
        // (index exists for the attribute)
        

        /* search for the record id (recid) correspoding to the attribute with
        attribute name attrName and with value attrval and satisfying the
        condition op using BPlusTree::bPlusSearch() */
        recId = BPlusTree::bPlusSearch(relId, attrName,attrVal,op);
    }


    // if there's no record satisfying the given condition (recId = {-1, -1})
    //     return E_NOTFOUND;
    if (recId.block == -1 && recId.slot == -1) {
        return E_NOTFOUND;
    }


    /* Copy the record with record id (recId) to the record buffer (record).
       For this, instantiate a RecBuffer class object by passing the recId and
       call the appropriate method to fetch the record
    */
    RecBuffer recBuffer(recId.block);
    recBuffer.getRecord(record, recId.slot);

    return SUCCESS;
}


// STAGE 8
int BlockAccess::deleteRelation(char relName[ATTR_SIZE]) {
    // if the relation to delete is either Relation Catalog or Attribute Catalog,
    //     return E_NOTPERMITTED
        // (check if the relation names are either "RELATIONCAT" and "ATTRIBUTECAT".
        // you may use the following constants: RELCAT_NAME and ATTRCAT_NAME)
    if(strcmp(relName, RELCAT_RELNAME) == 0 || strcmp(relName, ATTRCAT_RELNAME) == 0){
        return E_NOTPERMITTED;
    }

    /* reset the searchIndex of the relation catalog using
       RelCacheTable::resetSearchIndex() */
    RelCacheTable::resetSearchIndex(RELCAT_RELID);

    Attribute relNameAttr; // (stores relName as type union Attribute)
    // assign relNameAttr.sVal = relName
    strcpy(relNameAttr.sVal, relName);

    //  linearSearch on the relation catalog for RelName = relNameAttr
    RecId relCatRecId = linearSearch(RELCAT_RELID, RELCAT_ATTR_RELNAME, relNameAttr, EQ);

    // if the relation does not exist (linearSearch returned {-1, -1})
    //     return E_RELNOTEXIST
    if(relCatRecId.block == -1 && relCatRecId.slot == -1){
        return E_RELNOTEXIST;
    }

    Attribute relCatEntryRecord[RELCAT_NO_ATTRS];
    /* store the relation catalog record corresponding to the relation in
       relCatEntryRecord using RecBuffer.getRecord */
    RecBuffer relCatBuffer(relCatRecId.block);
    relCatBuffer.getRecord(relCatEntryRecord, relCatRecId.slot);

    /* get the first record block of the relation (firstBlock) using the
       relation catalog entry record */
    int firstBlock = relCatEntryRecord[RELCAT_FIRST_BLOCK_INDEX].nVal;
    /* get the number of attributes corresponding to the relation (numAttrs)
       using the relation catalog entry record */
    int numAttrs = relCatEntryRecord[RELCAT_NO_ATTRIBUTES_INDEX].nVal;

    /*
     Delete all the record blocks of the relation
    */
    // for each record block of the relation:
    //     get block header using BlockBuffer.getHeader
    //     get the next block from the header (rblock)
    //     release the block using BlockBuffer.releaseBlock
    //
    //     Hint: to know if we reached the end, check if nextBlock = -1
    int nextBlock = firstBlock;
    while(nextBlock != -1){
        RecBuffer recBuffer(nextBlock);
        HeadInfo header;
        recBuffer.getHeader(&header);
        nextBlock = header.rblock;
        recBuffer.releaseBlock();
    }


    /***
        Deleting attribute catalog entries corresponding the relation and index
        blocks corresponding to the relation with relName on its attributes
    ***/

    // reset the searchIndex of the attribute catalog
    RelCacheTable::resetSearchIndex(ATTRCAT_RELID);

    int numberOfAttributesDeleted = 0;

    while(true) {
        RecId attrCatRecId;
        // attrCatRecId = linearSearch on attribute catalog for RelName = relNameAttr
        attrCatRecId = linearSearch(ATTRCAT_RELID, ATTRCAT_ATTR_RELNAME, relNameAttr, EQ);

        // if no more attributes to iterate over (attrCatRecId == {-1, -1})
        //     break;
        if(attrCatRecId.block == -1 && attrCatRecId.slot == -1){
            break;
        }

        numberOfAttributesDeleted++;

        // create a RecBuffer for attrCatRecId.block
        // get the header of the block
        // get the record corresponding to attrCatRecId.slot
        RecBuffer attrCatBuffer(attrCatRecId.block);
        HeadInfo header;
        attrCatBuffer.getHeader(&header);
        Attribute attrCatRecord[ATTRCAT_NO_ATTRS];
        attrCatBuffer.getRecord(attrCatRecord, attrCatRecId.slot);

        // declare variable rootBlock which will be used to store the root
        // block field from the attribute catalog record.
        int rootBlock = attrCatRecord[ATTRCAT_ROOT_BLOCK_INDEX].nVal;
        // (This will be used later to delete any indexes if it exists)

        // Update the Slotmap for the block by setting the slot as SLOT_UNOCCUPIED
        // Hint: use RecBuffer.getSlotMap and RecBuffer.setSlotMap
        unsigned char *slotMap = (unsigned char *)malloc(sizeof(unsigned char) * header.numSlots);
        attrCatBuffer.getSlotMap(slotMap);
        slotMap[attrCatRecId.slot] = SLOT_UNOCCUPIED;
        attrCatBuffer.setSlotMap(slotMap);

        /* Decrement the numEntries in the header of the block corresponding to
           the attribute catalog entry and then set back the header
           using RecBuffer.setHeader */
        header.numEntries--;
        attrCatBuffer.setHeader(&header);

        /* If number of entries become 0, releaseBlock is called after fixing
           the linked list.
        */
        if (header.numEntries == 0) {
            /* Standard Linked List Delete for a Block
               Get the header of the left block and set it's rblock to this
               block's rblock
            */
            // create a RecBuffer for lblock and call appropriate methods
            RecBuffer leftBuffer(header.lblock);
            HeadInfo leftHeader;
            leftBuffer.getHeader(&leftHeader);
            leftHeader.rblock = header.rblock;
            leftBuffer.setHeader(&leftHeader);

            if (header.rblock != -1) {
                /* Get the header of the right block and set it's lblock to
                   this block's lblock */
                RecBuffer rightBuffer(header.rblock);
                HeadInfo rightHeader;
                rightBuffer.getHeader(&rightHeader);
                rightHeader.lblock = header.lblock;
                rightBuffer.setHeader(&rightHeader);
                // create a RecBuffer for rblock and call appropriate methods

            } else {
                // (the block being released is the "Last Block" of the relation.)
                /* update the Relation Catalog entry's LastBlock field for this
                   relation with the block number of the previous block. */
                RelCatEntry relCatEntry;
                RelCacheTable::getRelCatEntry(ATTRCAT_RELID, &relCatEntry);
                relCatEntry.lastBlk = header.lblock;
                RelCacheTable::setRelCatEntry(ATTRCAT_RELID, &relCatEntry);
            }

            // (Since the attribute catalog will never be empty(why?), we do not
            //  need to handle the case of the linked list becoming empty - i.e
            //  every block of the attribute catalog gets released.)


            // call releaseBlock()
            attrCatBuffer.releaseBlock();
        }

        // (the following part is only relevant once indexing has been implemented)
        // if index exists for the attribute (rootBlock != -1), call bplus destroy
        if (rootBlock != -1) {
            // delete the bplus tree rooted at rootBlock using BPlusTree::bPlusDestroy()
            BPlusTree::bPlusDestroy(rootBlock);
        }
    }

    /*** Delete the entry corresponding to the relation from relation catalog ***/
    // Fetch the header of Relcat block
    RecBuffer relBuffer(relCatRecId.block);
    HeadInfo header;
    relBuffer.getHeader(&header);

    /* Decrement the numEntries in the header of the block corresponding to the
       relation catalog entry and set it back */
    header.numEntries--;
    relBuffer.setHeader(&header);

    /* Get the slotmap in relation catalog, update it by marking the slot as
       free(SLOT_UNOCCUPIED) and set it back. */
    unsigned char *slotMap = (unsigned char *)malloc(sizeof(unsigned char) * header.numSlots);
    relBuffer.getSlotMap(slotMap);
    slotMap[relCatRecId.slot] = SLOT_UNOCCUPIED;
    relCatBuffer.setSlotMap(slotMap);

    /*** Updating the Relation Cache Table ***/
    /** Update relation catalog record entry (number of records in relation
        catalog is decreased by 1) **/
    // Get the entry corresponding to relation catalog from the relation
    // cache and update the number of records and set it back
    // (using RelCacheTable::setRelCatEntry() function)
    RelCatEntry relCatEntry;
    RelCacheTable::getRelCatEntry(RELCAT_RELID, &relCatEntry);
    relCatEntry.numRecs--;
    RelCacheTable::setRelCatEntry(RELCAT_RELID, &relCatEntry);

    /** Update attribute catalog entry (number of records in attribute catalog
        is decreased by numberOfAttributesDeleted) **/
    // i.e., #Records = #Records - numberOfAttributesDeleted


    // Get the entry corresponding to attribute catalog from the relation
    // cache and update the number of records and set it back
    // (using RelCacheTable::setRelCatEntry() function)
    RelCatEntry attrCatEntry;
    RelCacheTable::getRelCatEntry(ATTRCAT_RELID, &attrCatEntry);
    attrCatEntry.numRecs -= numberOfAttributesDeleted;
    RelCacheTable::setRelCatEntry(ATTRCAT_RELID, &attrCatEntry);

    return SUCCESS;
}



/*
NOTE: the caller is expected to allocate space for the argument `record` based
      on the size of the relation. This function will only copy the result of
      the projection onto the array pointed to by the argument.
*/
int BlockAccess::project(int relId, Attribute *record) {
    // get the previous search index of the relation relId from the relation
    // cache (use RelCacheTable::getSearchIndex() function)
    RecId prevRecId;
    RelCacheTable::getSearchIndex(relId, &prevRecId);

    // declare block and slot which will be used to store the record id of the
    // slot we need to check.
    int block, slot;

    /* if the current search index record is invalid(i.e. = {-1, -1})
       (this only happens when the caller reset the search index)
    */
    if (prevRecId.block == -1 && prevRecId.slot == -1)
    {
        // (new project operation. start from beginning)

        // get the first record block of the relation from the relation cache
        // (use RelCacheTable::getRelCatEntry() function of Cache Layer)
        RelCatEntry relCatEntry;
        RelCacheTable::getRelCatEntry(relId, &relCatEntry);
        // block = first record block of the relation
        // slot = 0
        block = relCatEntry.firstBlk;
        slot = 0;
    } else {
        // (a project/search operation is already in progress)

        // block = previous search index's block
        // slot = previous search index's slot + 1
        block = prevRecId.block;
        slot = prevRecId.slot + 1;
    }


    // The following code finds the next record of the relation
    /* Start from the record id (block, slot) and iterate over the remaining
       records of the relation */
    while (block != -1)
    {
        // create a RecBuffer object for block (using appropriate constructor!)
        RecBuffer recBuffer(block);

        // get header of the block using RecBuffer::getHeader() function
        // get slot map of the block using RecBuffer::getSlotMap() function
        HeadInfo header;
        recBuffer.getHeader(&header);
        unsigned char *slotMap = (unsigned char *)malloc(sizeof(unsigned char) * header.numSlots);
        recBuffer.getSlotMap(slotMap);

        if(slot >= header.numSlots) {
            // (no more slots in this block)
            // update block = right block of block
            // update slot = 0
            // (NOTE: if this is the last block, rblock would be -1. this would
            //        set block = -1 and fail the loop condition )
            block = header.rblock;
            slot = 0;
            continue;
        } else if (slotMap[slot] == SLOT_UNOCCUPIED) { // (i.e slot-th entry in slotMap contains SLOT_UNOCCUPIED)
            // increment slot
            slot++;
            continue;
        }
        else {
            // (the next occupied slot / record has been found)
            break;
        }
    }

    if (block == -1){
        // (a record was not found. all records exhausted)
        return E_NOTFOUND;
    }

    // declare nextRecId to store the RecId of the record found
    RecId nextRecId{block, slot};

    // set the search index to nextRecId using RelCacheTable::setSearchIndex
    RelCacheTable::setSearchIndex(relId, &nextRecId);

    /* Copy the record with record id (nextRecId) to the record buffer (record)
       For this Instantiate a RecBuffer class object by passing the recId and
       call the appropriate method to fetch the record
    */
    RecBuffer Buffer(nextRecId.block);
    Buffer.getRecord(record, nextRecId.slot);

    return SUCCESS;
}

int BlockAccess::insert(int relId, Attribute *record) {
    // get the relation catalog entry from relation cache
    // ( use RelCacheTable::getRelCatEntry() of Cache Layer)
	RelCatEntry relCatEntry;
	RelCacheTable::getRelCatEntry(relId, &relCatEntry);

    int blockNum = relCatEntry.firstBlk; // first record block of the relation

    // rec_id will be used to store where the new record will be inserted
    RecId rec_id = {-1, -1};

    int numOfSlots = relCatEntry.numSlotsPerBlk;
    int numOfAttributes = relCatEntry.numAttrs;

	// block number of the last element in the linked list = -1 
    int prevBlockNum = -1;

	// Traversing the linked list of existing record blocks of the relation
	// until a free slot is found OR until the end of the list is reached

    while (blockNum != -1) {
        // create a RecBuffer object for blockNum (using appropriate constructor!)
		RecBuffer blockBuffer (blockNum);

        // get header of block(blockNum) using RecBuffer::getHeader() function
		HeadInfo blockHeader;
		blockBuffer.getHeader(&blockHeader);

        // get slot map of block(blockNum) using RecBuffer::getSlotMap() function
		int numSlots = blockHeader.numSlots;
		unsigned char slotMap [numSlots];
		blockBuffer.getSlotMap(slotMap);

        // search for free slot in the block 'blockNum' and store it's rec-id in rec_id
        // (Free slot can be found by iterating over the slot map of the block)
		int slotIndex = 0;
		for (; slotIndex < numSlots; slotIndex++) {
        	// if a free slot is found, set rec_id and discontinue the traversal
           	// of the linked list of record blocks (break from the loop) 
			//* slot map stores SLOT_UNOCCUPIED if slot is free and SLOT_OCCUPIED if slot is occupied
			if (slotMap[slotIndex] == SLOT_UNOCCUPIED) {
				rec_id = RecId{blockNum, slotIndex};
				break;
			}
		}

		if (rec_id != RecId{-1, -1}) break;

        /* otherwise, continue to check the next block by updating the
           block numbers as follows:
              update prevBlockNum = blockNum
              update blockNum = header.rblock (next element in the linked list of record blocks)
        */
	   prevBlockNum = blockNum;
	   blockNum = blockHeader.rblock;
    }

    //  if no free slot is found in existing record blocks (rec_id = {-1, -1})
	if (rec_id == RecId{-1, -1})
    {
        // if relation is RELCAT, do not allocate any more blocks
        //     return E_MAXRELATIONS;
		if (relId == RELCAT_RELID) return E_MAXRELATIONS;

        // Otherwise,
        // get a new record block (using the appropriate RecBuffer constructor!)
		RecBuffer blockBuffer;

        // get the block number of the newly allocated block
        // (use BlockBuffer::getBlockNum() function)
        blockNum = blockBuffer.getBlockNum();
		
		// let ret be the return value of getBlockNum() function call
        if (blockNum == E_DISKFULL) return E_DISKFULL;

        // Assign rec_id.block = new block number(i.e. ret) and rec_id.slot = 0
		rec_id = RecId {blockNum, 0};

        // TODO: set the header of the new record block such that it links with
		// TODO: existing record blocks of the relation
		// TODO: set the block's header as follows:
		// blockType: REC, pblock: -1
		// lblock = -1 (if linked list of existing record blocks was empty
		// 				i.e this is the first insertion into the relation)
		// 		= prevBlockNum (otherwise),
		// rblock: -1, numEntries: 0,
		// numSlots: numOfSlots, numAttrs: numOfAttributes
		// (use BlockBuffer::setHeader() function)
        
		HeadInfo blockHeader;
		blockHeader.blockType = REC;
		blockHeader.lblock = prevBlockNum, blockHeader.rblock = blockHeader.pblock = -1;
		blockHeader.numAttrs = numOfAttributes, blockHeader.numSlots = numOfSlots, blockHeader.numEntries = 0;

		blockBuffer.setHeader(&blockHeader);
		
        /*
            set block's slot map with all slots marked as free
            (i.e. store SLOT_UNOCCUPIED for all the entries)
            (use RecBuffer::setSlotMap() function)
        */
	   	unsigned char slotMap [numOfSlots];
		for (int slotIndex = 0; slotIndex < numOfSlots; slotIndex++)
			slotMap[slotIndex] = SLOT_UNOCCUPIED;

		blockBuffer.setSlotMap(slotMap);

        // if prevBlockNum != -1
		if (prevBlockNum != -1)
        {
            // TODO: create a RecBuffer object for prevBlockNum
			RecBuffer prevBlockBuffer (prevBlockNum);

            // TODO: get the header of the block prevBlockNum and
			HeadInfo prevBlockHeader;
			prevBlockBuffer.getHeader(&prevBlockHeader);

            // TODO: update the rblock field of the header to the new block
			prevBlockHeader.rblock = blockNum;
            // number i.e. rec_id.block
            // (use BlockBuffer::setHeader() function)
			prevBlockBuffer.setHeader(&prevBlockHeader);
        }
        else
        {
            // update first block field in the relation catalog entry to the
            // new block (using RelCacheTable::setRelCatEntry() function)
			relCatEntry.firstBlk = blockNum;
			RelCacheTable::setRelCatEntry(relId, &relCatEntry);
        }

        // update last block field in the relation catalog entry to the
        // new block (using RelCacheTable::setRelCatEntry() function)
		relCatEntry.lastBlk = blockNum;
		RelCacheTable::setRelCatEntry(relId, &relCatEntry);
    }

     // create a RecBuffer object for rec_id.block
    RecBuffer blockBuffer (rec_id.block);

	// insert the record into rec_id'th slot using RecBuffer.setRecord())
	blockBuffer.setRecord(record, rec_id.slot);

     /* update the slot map of the block by marking entry of the slot to
       which record was inserted as occupied) */
    // (ie store SLOT_OCCUPIED in free_slot'th entry of slot map)
    // (use RecBuffer::getSlotMap() and RecBuffer::setSlotMap() functions)
	unsigned char slotmap [numOfSlots];
	blockBuffer.getSlotMap(slotmap);

	slotmap[rec_id.slot] = SLOT_OCCUPIED;
	blockBuffer.setSlotMap(slotmap);

    // increment the numEntries field in the header of the block to
    // which record was inserted
    // (use BlockBuffer::getHeader() and BlockBuffer::setHeader() functions)
	HeadInfo blockHeader;
	blockBuffer.getHeader(&blockHeader);

	blockHeader.numEntries++;
	blockBuffer.setHeader(&blockHeader);

    // Increment the number of records field in the relation cache entry for
    // the relation. (use RelCacheTable::setRelCatEntry function)
	relCatEntry.numRecs++;
	RelCacheTable::setRelCatEntry(relId, &relCatEntry);

    /* B+ Tree Insertions */
    // (the following section is only relevant once indexing has been implemented)

    int flag = SUCCESS;
    // Iterate over all the attributes of the relation
    // (let attrOffset be iterator ranging from 0 to numOfAttributes-1)
	for (int attrindex = 0; attrindex < numOfAttributes; attrindex++)
    {
        // get the attribute catalog entry for the attribute from the attribute cache
        // (use AttrCacheTable::getAttrCatEntry() with args relId and attrOffset)
		AttrCatEntry attrCatEntryBuffer;
		AttrCacheTable::getAttrCatEntry(relId, attrindex, &attrCatEntryBuffer);

        // get the root block field from the attribute catalog entry
		int rootBlock = attrCatEntryBuffer.rootBlock;

        // if index exists for the attribute(i.e. rootBlock != -1)
		if (rootBlock != -1)
        {
            /* insert the new record into the attribute's bplus tree using
             BPlusTree::bPlusInsert()*/
            int ret = BPlusTree::bPlusInsert(relId, attrCatEntryBuffer.attrName,record[attrindex], rec_id);

            if (ret == E_DISKFULL) {
                //(index for this attribute has been destroyed)
                flag = E_INDEX_BLOCKS_RELEASED;
            }
        }
    }

    return flag;
}
